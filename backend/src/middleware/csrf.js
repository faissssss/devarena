import crypto from 'crypto';

// Simple CSRF protection using double-submit cookie pattern
// This is a lightweight approach suitable for stateless APIs

const CSRF_COOKIE_NAME = 'devarena_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function setCsrfCookie(res, token) {
  // Double-submit cookie pattern requires the cookie to be readable by the client
  // The client reads this cookie and sends it back in the X-CSRF-Token header
  // Security is maintained through SameSite=strict and Secure flag in production
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be false for double-submit pattern
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

  // Provide specific error messages for different failure scenarios
  if (!cookieToken) {
    return res.status(403).json({
      error: {
        code: 'CSRF_COOKIE_MISSING',
        message: 'CSRF cookie not found. Please refresh the page and try again.',
      },
    });
  }

  if (!headerToken) {
    return res.status(403).json({
      error: {
        code: 'CSRF_HEADER_MISSING',
        message: 'CSRF token header not provided.',
      },
    });
  }

  if (cookieToken !== headerToken) {
    return res.status(403).json({
      error: {
        code: 'CSRF_TOKEN_MISMATCH',
        message: 'CSRF token mismatch. Please refresh the page and try again.',
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
