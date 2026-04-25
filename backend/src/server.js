import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import competitionRoutes from './routes/competitionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { startScheduler } from './scheduler.js';

dotenv.config();

const isDirectExecution =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'DevArena API is running' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/competitions', competitionRoutes);
  app.use('/api/bookmarks', bookmarkRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/users', userRoutes);

  app.use((req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  app.use((err, req, res, _next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
      error: {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred',
      },
    });
  });

  return app;
}

const app = createApp();
let serverInstance = null;

export function startServer(port = process.env.PORT || 3000) {
  if (serverInstance) {
    return serverInstance;
  }

  serverInstance = app.listen(port, () => {
    console.log(`DevArena API server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  startScheduler();
  return serverInstance;
}

if (isDirectExecution && process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
