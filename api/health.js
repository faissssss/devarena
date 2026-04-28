// Ultra-simple health check - no imports
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok',
    message: 'Vercel serverless function is working!',
    timestamp: new Date().toISOString()
  });
}
