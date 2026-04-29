import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * Helmet.js configuration for security headers
 * Protects against common web vulnerabilities
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://devarena.onrender.com'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for OAuth
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },
  xFrameOptions: { action: 'deny' },
  xContentTypeOptions: 'nosniff'
});

/**
 * Rate limiting middleware for API protection
 * Re-enabled for Render deployment (persistent container can handle it)
 */

// General API rate limiter - 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.'
    }
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check endpoint
    return req.path === '/health';
  }
});

// Authentication rate limiter - 5 requests per 15 minutes (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window per IP
  message: {
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful auth attempts
});
