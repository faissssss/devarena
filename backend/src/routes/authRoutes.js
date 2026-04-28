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
// Rate limiting removed - ZERO CONSTRAINTS for Vercel deployment
// import { authLimiter } from '../middleware/security.js';
import { warmupConnection } from '../utils/db.js';

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

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function getForwardedHost(req) {
  const forwardedHost = req.get('x-forwarded-host');
  if (forwardedHost) {
    return forwardedHost.split(',')[0].trim();
  }

  return req.get('host');
}

function getForwardedProto(req) {
  const forwardedProto = req.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0].trim();
  }

  return req.protocol;
}

function getRequestOrigin(req) {
  // Prioritize x-forwarded-host and x-forwarded-proto headers for Vercel production
  const forwardedHost = req.get('x-forwarded-host');
  const forwardedProto = req.get('x-forwarded-proto');
  
  // Debug logging for origin detection
  console.log('[OAuth Debug] Origin detection:', {
    'x-forwarded-host': forwardedHost,
    'x-forwarded-proto': forwardedProto,
    'host': req.get('host'),
    'protocol': req.protocol
  });
  
  // Use forwarded headers directly when available (Vercel production)
  if (forwardedHost && forwardedProto) {
    const origin = `${forwardedProto.split(',')[0].trim()}://${forwardedHost.split(',')[0].trim()}`;
    console.log('[OAuth Debug] Using forwarded headers, origin:', origin);
    return origin;
  }
  
  // Fall back to process.env.APP_URL if headers are missing
  if (process.env.APP_URL) {
    console.log('[OAuth Debug] Using APP_URL fallback:', process.env.APP_URL);
    return normalizeBaseUrl(process.env.APP_URL);
  }
  
  // Last resort: construct from host header
  const host = getForwardedHost(req);
  if (!host) {
    console.log('[OAuth Debug] No host available, returning null');
    return null;
  }
  
  const proto = getForwardedProto(req) || 'https';
  const origin = `${proto}://${host}`;
  console.log('[OAuth Debug] Using host header fallback, origin:', origin);
  return origin;
}

function getAppUrl(req) {
  // Get the request origin (prioritizes x-forwarded headers)
  const requestOrigin = normalizeBaseUrl(getRequestOrigin(req));
  
  // Use request origin if available
  if (requestOrigin) {
    return requestOrigin;
  }
  
  // Fall back to configured APP_URL or CORS_ORIGIN
  const configuredAppUrl = normalizeBaseUrl(
    process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'
  );
  
  return configuredAppUrl;
}

function getApiUrl(req) {
  // For API URL, prioritize x-forwarded headers (Vercel), then API_URL env var (local dev)
  const forwardedHost = req.get('x-forwarded-host');
  const forwardedProto = req.get('x-forwarded-proto');
  
  // Use forwarded headers directly when available (Vercel production)
  if (forwardedHost && forwardedProto) {
    const origin = `${forwardedProto.split(',')[0].trim()}://${forwardedHost.split(',')[0].trim()}`;
    console.log('[OAuth Debug] API URL from forwarded headers:', origin);
    return normalizeBaseUrl(origin);
  }
  
  // For local development, use API_URL (backend URL, not frontend APP_URL)
  const apiUrl = normalizeBaseUrl(process.env.API_URL || process.env.APP_URL || 'http://localhost:3000');
  console.log('[OAuth Debug] API URL:', apiUrl);
  return apiUrl;
}

function getRedirectUri(req, provider) {
  const redirectUri = `${getApiUrl(req)}/api/auth/oauth/${provider}/callback`;
  console.log('[OAuth Debug] Redirect URI for', provider, ':', redirectUri);
  return redirectUri;
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

function serializeCookie(req, name, value, maxAgeSeconds = 1200) {
  const isSecure = getForwardedProto(req) === 'https' || process.env.VERCEL === '1';
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${isSecure ? '; Secure' : ''}`;
}

function clearCookie(req, name) {
  const isSecure = getForwardedProto(req) === 'https' || process.env.VERCEL === '1';
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isSecure ? '; Secure' : ''}`;
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

async function requireAuthDatabase(_req, res, next) {
  try {
    await warmupConnection();
    return next();
  } catch (error) {
    return res.status(503).json({
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message:
          'The database is not reachable right now. Please verify DATABASE_URL and try again.',
      },
    });
  }
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

  res.setHeader('Set-Cookie', clearCookie(req, cookieName));

  if (!code || !state || !cookieValue) {
    return res.redirect(
      `${getAppUrl(req)}/auth/callback?error=${encodeURIComponent('OAuth session expired. Please try again.')}`
    );
  }

  const [expectedState, nextPath] = cookieValue.split('|');
  if (String(state) !== expectedState) {
    return res.redirect(
      `${getAppUrl(req)}/auth/callback?error=${encodeURIComponent('OAuth state mismatch. Please try again.')}`
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

    return res.redirect(`${getAppUrl(req)}/auth/callback?${redirectParams.toString()}`);
  } catch (error) {
    // Log detailed error information for debugging
    const redirectUri = getRedirectUri(req, provider);
    console.error(`OAuth callback error for ${provider}:`, {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      redirectUri,
      provider,
      stack: error.stack,
    });

    // Provide context-specific error messages
    let message;
    let errorCode = 'OAUTH_ERROR';
    
    if (error instanceof AuthServiceError) {
      // Use the detailed error message from AuthServiceError
      message = error.message;
      errorCode = error.code || 'OAUTH_ERROR';
      
      // Add additional context for specific error types
      if (error.code === 'OAUTH_EMAIL_REQUIRED') {
        message = `${provider === 'google' ? 'Google' : 'GitHub'} did not provide an email address. Please ensure your ${provider === 'google' ? 'Google' : 'GitHub'} account has a verified email.`;
        errorCode = 'OAUTH_EMAIL_REQUIRED';
      } else if (error.code?.includes('CONNECTION_REFUSED')) {
        message = `Unable to connect to ${provider === 'google' ? 'Google' : 'GitHub'}. Please try again later.`;
        errorCode = 'OAUTH_CONNECTION_REFUSED';
      } else if (error.code?.includes('TIMEOUT')) {
        message = `Connection to ${provider === 'google' ? 'Google' : 'GitHub'} timed out. Please check your internet connection and try again.`;
        errorCode = 'OAUTH_TIMEOUT';
      } else if (error.code?.includes('DNS_ERROR')) {
        message = `Unable to reach ${provider === 'google' ? 'Google' : 'GitHub'} services. Please check your internet connection and try again.`;
        errorCode = 'OAUTH_DNS_ERROR';
      } else if (error.code?.includes('TOKEN_EXCHANGE_FAILED')) {
        message = `${provider === 'google' ? 'Google' : 'GitHub'} authentication failed. Please try signing in again.`;
        errorCode = 'OAUTH_TOKEN_EXCHANGE_FAILED';
      } else if (error.code?.includes('API_ERROR')) {
        message = `${provider === 'google' ? 'Google' : 'GitHub'} authentication failed. Please try again.`;
        errorCode = 'OAUTH_API_ERROR';
      } else if (error.code?.includes('NETWORK_ERROR')) {
        message = `Network error during ${provider === 'google' ? 'Google' : 'GitHub'} authentication. Please check your connection and try again.`;
        errorCode = 'OAUTH_NETWORK_ERROR';
      }
    } else if (error.statusCode === 404 || error.code === 'ENOTFOUND') {
      // Platform 404 or DNS resolution failure
      message = `OAuth callback endpoint not found. This may be a platform routing issue. Redirect URI: ${redirectUri}`;
      errorCode = 'OAUTH_PLATFORM_404';
    } else if (error.code === '23505') {
      // Database constraint violation during user creation
      message = 'Unable to create account. This email or username may already be in use.';
      errorCode = 'OAUTH_DUPLICATE_ACCOUNT';
    } else if (error.name === 'DatabaseError' || error.code?.startsWith('23')) {
      // Other database errors during user creation
      message = 'Unable to create your account. Please try again later.';
      errorCode = 'OAUTH_DATABASE_ERROR';
    } else if (error.message?.includes('CSRF') || error.message?.includes('state')) {
      // CSRF/state validation failure
      message = 'OAuth state validation failed. This may be a CSRF protection issue. Please try signing in again.';
      errorCode = 'OAUTH_CSRF_FAILURE';
    } else if (error.message?.includes('redirect_uri_mismatch')) {
      // Provider config failure - redirect URI mismatch
      message = `OAuth redirect URI mismatch. Expected: ${redirectUri}. Please verify OAuth provider configuration.`;
      errorCode = 'OAUTH_REDIRECT_URI_MISMATCH';
    } else {
      // Generic fallback with provider context
      message = `${provider === 'google' ? 'Google' : 'GitHub'} sign-in failed. Please try again.`;
      errorCode = 'OAUTH_UNKNOWN_ERROR';
    }

    return res.redirect(
      `${getAppUrl(req)}/auth/callback?error=${encodeURIComponent(message)}&code=${errorCode}`
    );
  }
}

router.post(
  '/register',
  requireAuthDatabase,
  // authLimiter removed - ZERO CONSTRAINTS for Vercel deployment
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
  requireAuthDatabase,
  // authLimiter removed - ZERO CONSTRAINTS for Vercel deployment
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
  console.log('[OAuth Debug] OAuth initiation route hit');
  console.log('[OAuth Debug] Provider param:', req.params.provider);
  console.log('[OAuth Debug] Query params:', req.query);
  console.log('[OAuth Debug] Full URL:', req.url);
  console.log('[OAuth Debug] Full path:', req.path);
  
  const provider = String(req.params.provider || '').toLowerCase();
  if (!['google', 'github'].includes(provider)) {
    console.log('[OAuth Debug] Invalid provider:', provider);
    return res.status(400).json({
      error: { code: 'INVALID_PROVIDER', message: 'Unsupported OAuth provider' },
    });
  }

  try {
    const state = crypto.randomBytes(24).toString('hex');
    const nextPath = getSafeNext(req.query.next);
    const cookieName = `devarena_oauth_state_${provider}`;

    res.setHeader('Set-Cookie', serializeCookie(req, cookieName, `${state}|${nextPath}`));
    
    const authUrl = buildProviderAuthUrl(provider, req, state);
    console.log('[OAuth Debug] Redirecting to provider auth URL:', authUrl);
    
    return res.redirect(authUrl);
  } catch (error) {
    console.error(`OAuth initiation error for ${provider}:`, {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    
    let message;
    let errorCode = 'OAUTH_INIT_ERROR';
    
    if (error instanceof AuthServiceError) {
      message = error.message;
      errorCode = error.code || 'OAUTH_INIT_ERROR';
      
      // Specific error for missing OAuth configuration
      if (error.code === 'GOOGLE_OAUTH_NOT_CONFIGURED' || error.code === 'GITHUB_OAUTH_NOT_CONFIGURED') {
        message = `${provider === 'google' ? 'Google' : 'GitHub'} OAuth is not configured. Please contact support.`;
        errorCode = 'OAUTH_PROVIDER_NOT_CONFIGURED';
      }
    } else {
      message = `Unable to start ${provider} sign-in. Please try again.`;
    }

    return res.redirect(
      `${getAppUrl(req)}/auth/callback?error=${encodeURIComponent(message)}&code=${errorCode}`
    );
  }
});

router.get('/oauth/google/callback', async (req, res) => {
  return requireAuthDatabase(req, res, () => handleOAuthCallback(req, res, 'google'));
});

router.get('/oauth/github/callback', async (req, res) => {
  return requireAuthDatabase(req, res, () => handleOAuthCallback(req, res, 'github'));
});

export default router;
