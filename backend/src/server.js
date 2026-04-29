import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { Router } from 'express';

import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import competitionRoutes from './routes/competitionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { ensureCsrfToken } from './middleware/csrf.js';
import { helmetConfig, apiLimiter, authLimiter } from './middleware/security.js';
import logger from './utils/logger.js';
import {
  getDatabaseStatus,
  isDatabaseConfigured,
  warmupConnection,
} from './utils/db.js';
import { startScheduler } from './scheduler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDirectExecution =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  if (isDatabaseConfigured()) {
    warmupConnection().catch((error) => {
      logger.error(`Database warmup failed: ${error.message}`);
    });
  } else {
    logger.warn('DATABASE_URL is not configured; DB-backed routes will return 503');
  }

  // Security middleware - Helmet.js for security headers
  app.use(helmetConfig);

  // CORS configuration
  const allowedOrigins = new Set(
    [
      process.env.CORS_ORIGIN,
      process.env.APP_URL,
      process.env.API_URL,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ].filter(Boolean)
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        if (/^https:\/\/.*\.vercel\.app$/i.test(origin)) {
          callback(null, true);
          return;
        }

        if (process.env.RENDER && /^https:\/\/.*\.onrender\.com$/i.test(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Origin not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'X-CSRF-Token',
        'X-Requested-With',
        'Accept',
        'Accept-Version',
        'Content-Length',
        'Content-MD5',
        'Content-Type',
        'Date',
        'X-Api-Version',
        'Authorization'
      ],
    })
  );

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // CSRF protection
  app.use(ensureCsrfToken);

  // Apply general API rate limiting to all /api routes (except health check)
  // Only apply in production on Render (not in development or Vercel)
  if (process.env.NODE_ENV === 'production' && process.env.RENDER) {
    app.use('/api', apiLimiter);
  }

  const apiRouter = Router();

  // Health check endpoint (no rate limiting)
  apiRouter.get('/health', async (req, res) => {
    logger.info('Health check requested');
    const db = await getDatabaseStatus();
    res.status(db.connected || !db.configured ? 200 : 503).json({
      status: db.connected || !db.configured ? 'ok' : 'degraded',
      message: 'DevArena API is running',
      database: db,
    });
  });

  async function requireDatabase(_req, res, next) {
    try {
      await warmupConnection();
      return next();
    } catch (error) {
      logger.error(`Database unavailable for request: ${error.message}`);
      return res.status(503).json({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message:
            'The database is not reachable in this deployment. Verify DATABASE_URL in Railway and redeploy.',
        },
      });
    }
  }

  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/competitions', competitionRoutes);
  apiRouter.use('/bookmarks', requireDatabase, bookmarkRoutes);
  apiRouter.use('/admin', requireDatabase, adminRoutes);
  apiRouter.use('/users', requireDatabase, userRoutes);

  // API routes - single mounting for deterministic routing
  // All API requests route through /api prefix only (not root)
  // This ensures deterministic routing through api/[...path].js on Vercel
  app.use('/api', apiRouter);
  
  // Log registered routes for debugging
  console.log('[Server] Registered API routes:');
  console.log('  /api/health');
  console.log('  /api/auth/* (including /api/auth/oauth/:provider)');
  console.log('  /api/competitions/*');
  console.log('  /api/bookmarks/*');
  console.log('  /api/admin/*');
  console.log('  /api/users/*');

  // Serve static frontend files in production
  if (process.env.NODE_ENV === 'production') {
    const frontendDistPath = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendDistPath));
    
    // Handle client-side routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  }

  app.use((req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

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
