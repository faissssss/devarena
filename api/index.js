import app from '../backend/api/index.js';

export default function handler(req, res) {
  // Vercel strips /api prefix when routing to api/index.js
  // But Express app expects routes to start with /api
  // So we need to prepend it back
  if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }
  
  app(req, res, (err) => {
    if (err) {
      res.status(500).json({
        error: { code: 'SERVER_ERROR', message: err.message }
      });
    }
  });
}
