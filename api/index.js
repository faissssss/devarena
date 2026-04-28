import app from '../backend/api/index.js';

export default function handler(req, res) {
  app(req, res, (err) => {
    if (err) {
      res.status(500).json({
        error: { code: 'SERVER_ERROR', message: err.message }
      });
    }
  });
}
