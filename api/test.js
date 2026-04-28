// Simple test endpoint to verify Vercel function works
export default function handler(req, res) {
  res.status(200).json({
    message: 'Vercel function is working!',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      VERCEL: process.env.VERCEL || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      CORS_ORIGIN: process.env.CORS_ORIGIN || 'not set',
    }
  });
}
