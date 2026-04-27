import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import competitionRoutes from './routes/competitionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { ensureCsrfToken } from './middleware/csrf.js';
import { helmetConfig, apiLimiter } from './middleware/security.js';
import logger from './utils/logger.js';
import { startScheduler } from './scheduler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDirectExecution =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

export function createApp() {
  const app = express();

  // Security middleware - Helmet.js for security headers
  app.use(helmetConfig);

  // CORS configuration
  app.use(cors({ 
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true // Allow cookies to be sent
  }));

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // CSRF protection
  app.use(ensureCsrfToken);

  // Rate limiting for all API routes
  app.use('/api/', apiLimiter);

  // Health check endpoint (no rate limiting)
  app.get('/api/health', (req, res) => {
    logger.info('Health check requested');
    res.json({ status: 'ok', message: 'DevArena API is running' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/competitions', competitionRoutes);
  app.use('/api/bookmarks', bookmarkRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/users', userRoutes);

  // Serve static frontend files in production
  if (process.env.NODE_ENV === 'production') {
    const frontendDistPath = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendDistPath));
    
    // Handle client-side routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  } else {
    // In development, return 404 for non-API routes
    app.use((req, res) => {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Route not found' },
      });
    });
  }

  app.use((err, req, res, _next) => {
    // Log error with Winston
    logger.error(`${err.message}`, { 
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

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
    logger.info(`DevArena API server running on port ${port}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  });

  startScheduler();
  return serverInstance;
}

if (isDirectExecution && process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
