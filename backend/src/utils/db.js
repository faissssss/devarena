import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (3 levels up: utils -> src -> backend -> root)
dotenv.config({ path: join(__dirname, '../../../.env') });

const { Pool } = pg;

/**
 * Database connection configuration
 */
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_SIZE || '20', 10), // Maximum number of clients in the pool
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

/**
 * Initialize the database connection pool
 * @returns {Pool} PostgreSQL connection pool
 */
export function initializePool() {
  if (!process.env.DATABASE_URL) {
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
};
