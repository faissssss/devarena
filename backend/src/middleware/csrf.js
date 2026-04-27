import crypto from 'crypto';

// Simple CSRF protection using double-submit cookie pattern
// This is a lightweight approach suitable for stateless APIs

const CSRF_COOKIE_NAME = 'devarena_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function setCsrfCookie(res, token) {
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function validateCsrfToken(req, res, next) {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'Invalid or missing CSRF token',
      },
    });
  }

  return next();
}

// Middleware to set CSRF token for new sessions
export function ensureCsrfToken(req, res, next) {
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = generateCsrfToken();
    setCsrfCookie(res, token);
  }
  return next();
}
