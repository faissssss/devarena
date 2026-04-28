import helmet from 'helmet';
// Rate limiting removed - ZERO CONSTRAINTS for Vercel deployment
// import rateLimit from 'express-rate-limit';

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
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for OAuth
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

/**
 * RATE LIMITING COMPLETELY REMOVED
 * 
 * All rate limiting middleware has been removed to prevent blocking legitimate users
 * on Vercel production deployment. This ensures ZERO CONSTRAINTS on:
 * - API requests (previously limited to 100 requests per 15 minutes)
 * - Authentication requests (previously limited to 5 requests per 15 minutes)
 * - Sync requests (previously limited to 10 requests per hour)
 * 
 * Security headers (Helmet) continue to apply for protection.
 */
