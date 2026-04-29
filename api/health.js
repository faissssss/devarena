/**
 * Vercel Serverless Health Check Endpoint
 * 
 * Provides a lightweight health check for monitoring services.
 * This is a separate function to avoid cold starts on the main API.
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET requests are allowed'
      }
    });
  }

  // Return basic health status
  return res.status(200).json({
    status: 'ok',
    message: 'DevArena API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'unknown'
  });
}
