/**
 * Vercel Serverless Test Endpoint
 * 
 * Simple test endpoint to verify serverless functions are working.
 * Useful for debugging deployment issues.
 */

export default async function handler(req, res) {
  return res.status(200).json({
    message: 'Vercel serverless function is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'development',
    region: process.env.VERCEL_REGION || 'unknown',
    method: req.method,
    url: req.url
  });
}
