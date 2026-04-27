import crypto from 'crypto';
import { Router } from 'express';
import { body, validationResult } from 'express-validator';

import {
  AuthServiceError,
  exchangeGithubCode,
  exchangeGoogleCode,
  login,
  loginWithOAuth,
  register,
} from '../services/authService.js';

const router = Router();

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: errors.array(),
      },
    });
    return false;
  }

  return true;
}

function getAppUrl() {
  return process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
}

function getApiUrl(req) {
  if (process.env.API_URL) {
    return process.env.API_URL;
  }

  return `${req.protocol}://${req.get('host')}`;
}

function getRedirectUri(req, provider) {
  return `${getApiUrl(req)}/api/auth/oauth/${provider}/callback`;
}

function getSafeNext(nextPath) {
  if (typeof nextPath !== 'string') {
    return '/';
  }

  if (!nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return '/';
  }

  return nextPath;
}

function serializeCookie(name, value, maxAgeSeconds = 1200) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || '')
      .split(';')
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separatorIndex = cookie.indexOf('=');
        const key = separatorIndex >= 0 ? cookie.slice(0, separatorIndex) : cookie;
        const value = separatorIndex >= 0 ? cookie.slice(separatorIndex + 1) : '';
        return [key, decodeURIComponent(value)];
      })
  );
}

function buildProviderAuthUrl(provider, req, state) {
  const redirectUri = getRedirectUri(req, provider);

  if (provider === 'google') {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new AuthServiceError('Google OAuth is not configured', 'GOOGLE_OAUTH_NOT_CONFIGURED', 500);
    }
    const search = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${search.toString()}`;
  }

  if (!process.env.GITHUB_CLIENT_ID) {
    throw new AuthServiceError('GitHub OAuth is not configured', 'GITHUB_OAUTH_NOT_CONFIGURED', 500);
  }
  const search = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state,
    allow_signup: 'true', // Allow new account creation
  });

  return `https://github.com/login/oauth/authorize?${search.toString()}`;
}

async function handleOAuthCallback(req, res, provider) {
  const { code, state } = req.query;
  const cookieName = `devarena_oauth_state_${provider}`;
  const cookies = parseCookies(req);
  const cookieValue = cookies[cookieName];

  res.setHeader('Set-Cookie', clearCookie(cookieName));

  if (!code || !state || !cookieValue) {
    return res.redirect(
      `${getAppUrl()}/auth/callback?error=${encodeURIComponent('OAuth session expired. Please try again.')}`
    );
  }

  const [expectedState, nextPath] = cookieValue.split('|');
  if (String(state) !== expectedState) {
    return res.redirect(
      `${getAppUrl()}/auth/callback?error=${encodeURIComponent('OAuth state mismatch. Please try again.')}`
    );
  }

  try {
    const profile = provider === 'google'
      ? await exchangeGoogleCode(String(code), getRedirectUri(req, provider))
      : await exchangeGithubCode(String(code), getRedirectUri(req, provider));

    const authResult = await loginWithOAuth(profile);
    const redirectParams = new URLSearchParams({
      token: authResult.token,
      next: getSafeNext(nextPath),
    });

    return res.redirect(`${getAppUrl()}/auth/callback?${redirectParams.toString()}`);
  } catch (error) {
    // Log detailed error information for debugging
    console.error(`OAuth callback error for ${provider}:`, {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
    });

    // Provide context-specific error messages
    let message;
    if (error instanceof AuthServiceError) {
      // Use the detailed error message from AuthServiceError
      message = error.message;
      
      // Add additional context for specific error types
      if (error.code === 'OAUTH_EMAIL_REQUIRED') {
        message = `${provider === 'google' ? 'Google' : 'GitHub'} did not provide an email address. Please ensure your ${provider === 'google' ? 'Google' : 'GitHub'} account has a verified email.`;
      } else if (error.code?.includes('CONNECTION_REFUSED')) {
        message = `Unable to connect to ${provider === 'google' ? 'Google' : 'GitHub'}. Please try again later.`;
      } else if (error.code?.includes('TIMEOUT')) {
        message = `Connection to ${provider === 'google' ? 'Google' : 'GitHub'} timed out. Please check your internet connection and try again.`;
      } else if (error.code?.includes('DNS_ERROR')) {
        message = `Unable to reach ${provider === 'google' ? 'Google' : 'GitHub'} services. Please check your internet connection and try again.`;
      } else if (error.code?.includes('TOKEN_EXCHANGE_FAILED')) {
        message = `${provider === 'google' ? 'Google' : 'GitHub'} authentication failed. Please try signing in again.`;
      } else if (error.code?.includes('API_ERROR')) {
        message = `${provider === 'google' ? 'Google' : 'GitHub'} authentication failed. Please try again.`;
      } else if (error.code?.includes('NETWORK_ERROR')) {
        message = `Network error during ${provider === 'google' ? 'Google' : 'GitHub'} authentication. Please check your connection and try again.`;
      }
    } else if (error.code === '23505') {
      // Database constraint violation during user creation
      message = 'Unable to create account. This email or username may already be in use.';
    } else if (error.name === 'DatabaseError' || error.code?.startsWith('23')) {
      // Other database errors during user creation
      message = 'Unable to create your account. Please try again later.';
    } else {
      // Generic fallback with provider context
      message = `${provider === 'google' ? 'Google' : 'GitHub'} sign-in failed. Please try again.`;
    }

    return res.redirect(
      `${getAppUrl()}/auth/callback?error=${encodeURIComponent(message)}`
    );
  }
}

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3 }),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
  ],
  async (req, res, next) => {
    if (!handleValidation(req, res)) {
      return;
    }

    try {
      const user = await register(req.body);
      res.status(201).json({ user });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: { code: error.code ?? 'AUTH_ERROR', message: error.message },
        });
      }
      return next(error);
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').isLength({ min: 1 })],
  async (req, res, next) => {
    if (!handleValidation(req, res)) {
      return;
    }

    try {
      const result = await login(req.body);
      res.json(result);
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: { code: error.code ?? 'AUTH_ERROR', message: error.message },
        });
      }
      return next(error);
    }
  }
);

router.get('/oauth/:provider', async (req, res) => {
  const provider = String(req.params.provider || '').toLowerCase();
  if (!['google', 'github'].includes(provider)) {
    return res.status(400).json({
      error: { code: 'INVALID_PROVIDER', message: 'Unsupported OAuth provider' },
    });
  }

  try {
    const state = crypto.randomBytes(24).toString('hex');
    const nextPath = getSafeNext(req.query.next);
    const cookieName = `devarena_oauth_state_${provider}`;

    res.setHeader('Set-Cookie', serializeCookie(cookieName, `${state}|${nextPath}`));
    return res.redirect(buildProviderAuthUrl(provider, req, state));
  } catch (error) {
    const message = error instanceof AuthServiceError
      ? error.message
      : `Unable to start ${provider} sign-in`;

    return res.redirect(
      `${getAppUrl()}/auth/callback?error=${encodeURIComponent(message)}`
    );
  }
});

router.get('/oauth/google/callback', async (req, res) => {
  return handleOAuthCallback(req, res, 'google');
});

router.get('/oauth/github/callback', async (req, res) => {
  return handleOAuthCallback(req, res, 'github');
});

export default router;
