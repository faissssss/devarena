import axios from 'axios';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { query } from '../utils/db.js';

const DEFAULT_SALT_ROUNDS = 10;
const DEFAULT_TOKEN_EXPIRES_IN = '7d';

export class AuthServiceError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.name = 'AuthServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new AuthServiceError(
      'JWT_SECRET environment variable is required',
      'MISSING_JWT_SECRET',
      500
    );
  }

  return process.env.JWT_SECRET;
}

function sanitizeUser(userRow) {
  if (!userRow) {
    return null;
  }

  const user = { ...userRow };
  delete user.password_hash;
  return user;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function slugifyUsername(value) {
  const cleaned = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!cleaned) {
    return 'player';
  }

  if (cleaned.length >= 3) {
    return cleaned.slice(0, 50);
  }

  return `${cleaned}${'user'.slice(0, 3 - cleaned.length)}`.slice(0, 50);
}

async function generateUniqueUsername(seedValue) {
  const base = slugifyUsername(seedValue);

  for (let index = 0; index < 100; index += 1) {
    const suffix = index === 0 ? '' : `_${index + 1}`;
    const candidate = `${base.slice(0, 50 - suffix.length)}${suffix}`;
    const result = await query('SELECT 1 FROM users WHERE username = $1', [candidate]);

    if (result.rowCount === 0) {
      return candidate;
    }
  }

  return `${base.slice(0, 40)}_${crypto.randomBytes(4).toString('hex')}`.slice(0, 50);
}

async function getUserByEmail(email) {
  const result = await query(
    `SELECT id, username, email, password_hash, role, created_at, avatar_url
     FROM users
     WHERE email = $1`,
    [normalizeEmail(email)]
  );

  return result.rows[0] ?? null;
}

async function getUserByOAuthAccount(provider, providerUserId) {
  const result = await query(
    `SELECT u.id, u.username, u.email, u.password_hash, u.role, u.created_at, u.avatar_url
     FROM user_oauth_accounts oa
     INNER JOIN users u ON u.id = oa.user_id
     WHERE oa.provider = $1 AND oa.provider_user_id = $2`,
    [provider, String(providerUserId)]
  );

  return result.rows[0] ?? null;
}

async function linkOAuthAccount(userId, provider, providerUserId, providerEmail) {
  await query(
    `INSERT INTO user_oauth_accounts (user_id, provider, provider_user_id, provider_email)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (provider, provider_user_id)
     DO UPDATE SET
       user_id = EXCLUDED.user_id,
       provider_email = EXCLUDED.provider_email`,
    [userId, provider, String(providerUserId), normalizeEmail(providerEmail) || null]
  );
}

export async function hashPassword(password) {
  return bcrypt.hash(password, DEFAULT_SALT_ROUNDS);
}

export async function comparePassword(password, passwordHash) {
  if (!passwordHash) {
    return false;
  }

  return bcrypt.compare(password, passwordHash);
}

export function generateToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_TOKEN_EXPIRES_IN,
  });
}

export function validateToken(token) {
  return jwt.verify(token, getJwtSecret());
}

export async function register({ username, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await hashPassword(password);

  try {
    const result = await query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, username, email, role, created_at, avatar_url`,
      [username.trim(), normalizedEmail, passwordHash]
    );

    return sanitizeUser(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      const conflictField = error.constraint?.includes('email')
        ? 'email'
        : error.constraint?.includes('username')
          ? 'username'
          : 'user';

      throw new AuthServiceError(
        `${conflictField} already exists`,
        'DUPLICATE_USER',
        409
      );
    }

    throw error;
  }
}

export async function login({ email, password }) {
  const user = await getUserByEmail(email);

  if (!user) {
    throw new AuthServiceError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
  }

  if (!user.password_hash) {
    throw new AuthServiceError(
      'This account uses Google or GitHub sign-in. Continue with your provider instead.',
      'PASSWORD_LOGIN_DISABLED',
      400
    );
  }

  const isValidPassword = await comparePassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new AuthServiceError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
  }

  const sanitizedUser = sanitizeUser(user);
  const token = generateToken({
    userId: sanitizedUser.id,
    role: sanitizedUser.role,
  });

  return {
    token,
    user: sanitizedUser,
  };
}

export async function loginWithOAuth({
  provider,
  providerUserId,
  email,
  username,
  avatarUrl,
}) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new AuthServiceError(
      `Unable to determine email address from ${provider}`,
      'OAUTH_EMAIL_REQUIRED',
      400
    );
  }

  let user = await getUserByOAuthAccount(provider, providerUserId);

  if (!user) {
    user = await getUserByEmail(normalizedEmail);

    if (!user) {
      const generatedUsername = await generateUniqueUsername(username || normalizedEmail.split('@')[0]);
      const insertResult = await query(
        `INSERT INTO users (username, email, password_hash, role, avatar_url)
         VALUES ($1, $2, $3, 'user', $4)
         RETURNING id, username, email, password_hash, role, created_at, avatar_url`,
        [generatedUsername, normalizedEmail, null, avatarUrl || null]
      );
      user = insertResult.rows[0];
    } else if (avatarUrl && !user.avatar_url) {
      const updateResult = await query(
        `UPDATE users
         SET avatar_url = COALESCE(avatar_url, $2)
         WHERE id = $1
         RETURNING id, username, email, password_hash, role, created_at, avatar_url`,
        [user.id, avatarUrl]
      );
      user = updateResult.rows[0];
    }

    await linkOAuthAccount(user.id, provider, providerUserId, normalizedEmail);
  }

  const sanitizedUser = sanitizeUser(user);
  const token = generateToken({
    userId: sanitizedUser.id,
    role: sanitizedUser.role,
  });

  return {
    token,
    user: sanitizedUser,
  };
}

function getGoogleConfig() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new AuthServiceError(
      'Google OAuth is not configured',
      'GOOGLE_OAUTH_NOT_CONFIGURED',
      500
    );
  }

  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

function getGithubConfig() {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    throw new AuthServiceError(
      'GitHub OAuth is not configured',
      'GITHUB_OAUTH_NOT_CONFIGURED',
      500
    );
  }

  return {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

export async function exchangeGoogleCode(code, redirectUri) {
  const { clientId, clientSecret } = getGoogleConfig();
  
  try {
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 30000,
      }
    );

    const userInfoResponse = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
      timeout: 30000,
    });

    return {
      provider: 'google',
      providerUserId: userInfoResponse.data.sub,
      email: userInfoResponse.data.email,
      username: userInfoResponse.data.name || userInfoResponse.data.given_name,
      avatarUrl: userInfoResponse.data.picture || null,
    };
  } catch (error) {
    // Handle network-specific errors
    if (error.code === 'ECONNREFUSED') {
      console.error('Google OAuth connection refused:', error.message);
      throw new AuthServiceError(
        'Unable to connect to Google. Please try again later.',
        'GOOGLE_CONNECTION_REFUSED',
        503
      );
    }
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.error('Google OAuth timeout:', error.message);
      throw new AuthServiceError(
        'Connection to Google timed out. Please check your internet connection and try again.',
        'GOOGLE_TIMEOUT',
        504
      );
    }
    
    if (error.code === 'ENOTFOUND') {
      console.error('Google OAuth DNS resolution failed:', error.message);
      throw new AuthServiceError(
        'Unable to reach Google services. Please check your internet connection and try again.',
        'GOOGLE_DNS_ERROR',
        503
      );
    }
    
    // Log detailed error for debugging
    console.error('Google OAuth error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    // Re-throw if already an AuthServiceError
    if (error instanceof AuthServiceError) {
      throw error;
    }
    
    // Handle API errors from Google
    if (error.response) {
      throw new AuthServiceError(
        'Google authentication failed. Please try again.',
        'GOOGLE_API_ERROR',
        error.response.status || 400
      );
    }
    
    // Generic network error
    throw new AuthServiceError(
      'Network error during Google authentication. Please check your connection and try again.',
      'GOOGLE_NETWORK_ERROR',
      503
    );
  }
}

export async function exchangeGithubCode(code, redirectUri) {
  const { clientId, clientSecret } = getGithubConfig();
  
  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      },
      {
        headers: { Accept: 'application/json' },
        timeout: 30000,
      }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      // Log detailed error for GitHub token exchange failures
      console.error('GitHub token exchange failed:', {
        response: tokenResponse.data,
        error: tokenResponse.data.error,
        error_description: tokenResponse.data.error_description,
      });
      
      throw new AuthServiceError(
        'GitHub did not return an access token. Please try again.',
        'GITHUB_TOKEN_EXCHANGE_FAILED',
        400
      );
    }

    const [profileResponse, emailsResponse] = await Promise.all([
      axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'DevArena',
        },
        timeout: 30000,
      }),
      axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'DevArena',
        },
        timeout: 30000,
      }),
    ]);

    const primaryEmail = (emailsResponse.data || []).find((item) => item.primary && item.verified)
      || (emailsResponse.data || []).find((item) => item.verified)
      || emailsResponse.data?.[0];

    return {
      provider: 'github',
      providerUserId: profileResponse.data.id,
      email: primaryEmail?.email,
      username: profileResponse.data.name || profileResponse.data.login,
      avatarUrl: profileResponse.data.avatar_url || null,
    };
  } catch (error) {
    // Handle network-specific errors
    if (error.code === 'ECONNREFUSED') {
      console.error('GitHub OAuth connection refused:', error.message);
      throw new AuthServiceError(
        'Unable to connect to GitHub. Please try again later.',
        'GITHUB_CONNECTION_REFUSED',
        503
      );
    }
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.error('GitHub OAuth timeout:', error.message);
      throw new AuthServiceError(
        'Connection to GitHub timed out. Please check your internet connection and try again.',
        'GITHUB_TIMEOUT',
        504
      );
    }
    
    if (error.code === 'ENOTFOUND') {
      console.error('GitHub OAuth DNS resolution failed:', error.message);
      throw new AuthServiceError(
        'Unable to reach GitHub services. Please check your internet connection and try again.',
        'GITHUB_DNS_ERROR',
        503
      );
    }
    
    // Log detailed error for debugging GitHub OAuth failures
    console.error('GitHub OAuth error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    // Re-throw if already an AuthServiceError
    if (error instanceof AuthServiceError) {
      throw error;
    }
    
    // Handle API errors from GitHub
    if (error.response) {
      throw new AuthServiceError(
        'GitHub authentication failed. Please try again.',
        'GITHUB_API_ERROR',
        error.response.status || 400
      );
    }
    
    // Generic network error
    throw new AuthServiceError(
      'Network error during GitHub authentication. Please check your connection and try again.',
      'GITHUB_NETWORK_ERROR',
      503
    );
  }
}

export default {
  hashPassword,
  comparePassword,
  generateToken,
  validateToken,
  register,
  login,
  loginWithOAuth,
  exchangeGoogleCode,
  exchangeGithubCode,
};
