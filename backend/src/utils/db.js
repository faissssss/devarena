import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load local env files for non-Vercel environments without overriding runtime env vars.
for (const envPath of [
  join(__dirname, '../../../.env.local'),
  join(__dirname, '../../../.env'),
]) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

const { Pool } = pg;
const DEFAULT_POOL_SIZE = process.env.VERCEL ? '5' : '20';

/**
 * Database connection configuration
 */
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_SIZE || DEFAULT_POOL_SIZE, 10), // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
  // Retry settings
  maxRetries: parseInt(process.env.SYNC_RETRIES || '3', 10),
  retryDelay: 1000, // Initial retry delay in milliseconds
};

/**
 * PostgreSQL connection pool instance
 */
let pool = null;
let warmupPromise = null;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Initialize the database connection pool
 * @returns {Pool} PostgreSQL connection pool
 */
export function initializePool() {
  if (!isDatabaseConfigured()) {
    throw new Error(
      'DATABASE_URL environment variable is required but not defined'
    );
  }

  if (pool) {
    return pool;
  }

  pool = new Pool({
    connectionString: dbConfig.connectionString,
    max: dbConfig.max,
    idleTimeoutMillis: dbConfig.idleTimeoutMillis,
    connectionTimeoutMillis: dbConfig.connectionTimeoutMillis,
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
  });

  // Handle pool connection events
  pool.on('connect', () => {
    console.log('Database client connected to pool');
  });

  pool.on('remove', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log('Database client removed from pool');
    }
  });

  return pool;
}

/**
 * Get the database connection pool
 * @returns {Pool} PostgreSQL connection pool
 */
export function getPool() {
  if (!pool) {
    return initializePool();
  }
  return pool;
}

/**
 * Execute a database query with retry logic
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @param {number} retryCount - Current retry attempt (internal use)
 * @returns {Promise<Object>} Query result
 */
export async function query(text, params = [], retryCount = 0) {
  const currentPool = getPool();

  try {
    const start = Date.now();
    const result = await currentPool.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn('Slow query detected', {
        duration,
        text: text.substring(0, 100),
      });
    }

    return result;
  } catch (error) {
    console.error('Database query error', {
      error: error.message,
      query: text.substring(0, 100),
      retryCount,
    });

    // Retry logic for connection errors
    if (shouldRetry(error) && retryCount < dbConfig.maxRetries) {
      await resetBrokenPool();
      const delay = calculateRetryDelay(retryCount);
      console.log(
        `Retrying query in ${delay}ms (attempt ${retryCount + 1}/${dbConfig.maxRetries})`
      );

      await sleep(delay);
      return query(text, params, retryCount + 1);
    }

    // Re-throw error if max retries exceeded or non-retryable error
    throw error;
  }
}

/**
 * Get a client from the pool for transaction support
 * @returns {Promise<PoolClient>} Database client
 */
export async function getClient() {
  const currentPool = getPool();
  return await currentPool.connect();
}

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('Database connection successful', {
      timestamp: result.rows[0].current_time,
    });
    return true;
  } catch (error) {
    console.error('Database connection test failed', {
      error: error.message,
    });
    return false;
  }
}

/**
 * Close the database connection pool
 * @returns {Promise<void>}
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection pool closed');
  }

  warmupPromise = null;
}

async function resetBrokenPool() {
  if (!pool) {
    return;
  }

  try {
    await closePool();
  } catch (closeError) {
    console.error('Failed to reset database connection pool', {
      error: closeError.message,
    });
    pool = null;
    warmupPromise = null;
  }
}

export async function warmupConnection() {
  if (!isDatabaseConfigured()) {
    throw new Error(
      'DATABASE_URL environment variable is required but not defined'
    );
  }

  if (!warmupPromise) {
    warmupPromise = (async () => {
      const currentPool = getPool();
      await currentPool.query('SELECT 1');
      return true;
    })().catch(async (error) => {
      warmupPromise = null;
      if (shouldRetry(error)) {
        await resetBrokenPool();
      }
      throw error;
    });
  }

  return warmupPromise;
}

export async function getDatabaseStatus() {
  if (!isDatabaseConfigured()) {
    return {
      connected: false,
      configured: false,
      message: 'DATABASE_URL is not configured',
    };
  }

  try {
    await warmupConnection();
    return {
      connected: true,
      configured: true,
      message: 'Database connection is ready',
    };
  } catch (error) {
    return {
      connected: false,
      configured: true,
      message: error.message || 'Database connection failed',
    };
  }
}

/**
 * Determine if an error should trigger a retry
 * @param {Error} error - Database error
 * @returns {boolean} True if error is retryable
 */
function shouldRetry(error) {
  // Retry on connection errors
  const retryableErrors = [
    'ECONNREFUSED', // Connection refused
    'ETIMEDOUT', // Connection timeout
    'ENOTFOUND', // DNS lookup failed
    'ECONNRESET', // Connection reset
    'EPIPE', // Broken pipe
    'EAI_AGAIN', // DNS lookup timeout
  ];

  return (
    retryableErrors.includes(error.code) ||
    error.message.includes('Connection terminated') ||
    error.message.includes('Connection lost') ||
    error.message.includes('server closed the connection')
  );
}

/**
 * Calculate retry delay with exponential backoff
 * @param {number} retryCount - Current retry attempt
 * @returns {number} Delay in milliseconds
 */
function calculateRetryDelay(retryCount) {
  // Exponential backoff: 1s, 2s, 4s, 8s, etc.
  return dbConfig.retryDelay * Math.pow(2, retryCount);
}

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Export default pool getter for convenience
export default {
  query,
  getPool,
  getClient,
  testConnection,
  closePool,
  initializePool,
  isDatabaseConfigured,
  warmupConnection,
  getDatabaseStatus,
};
