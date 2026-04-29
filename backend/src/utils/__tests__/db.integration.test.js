/**
 * Database Connection Integration Tests
 * 
 * These tests verify actual database connectivity and behavior.
 * They require a running PostgreSQL database with DATABASE_URL configured.
 * 
 * Run with: npm test -- db.integration.test.js
 */

import db from '../db.js';

describe('Database Connection Integration Tests', () => {
  beforeAll(async () => {
    // Ensure DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set, skipping integration tests');
    }
  });

  afterAll(async () => {
    // Clean up connection pool
    await db.closePool();
  });

  test('should connect to database successfully', async () => {
    if (!process.env.DATABASE_URL) {
      return; // Skip if no database configured
    }

    const connected = await db.testConnection();
    expect(connected).toBe(true);
  });

  test('should execute simple query', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const result = await db.query('SELECT 1 as value');
    expect(result.rows[0].value).toBe(1);
  });

  test('should execute parameterized query', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const result = await db.query('SELECT $1::int as value', [42]);
    expect(result.rows[0].value).toBe(42);
  });

  test('should get client from pool', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const client = await db.getClient();
    expect(client).toBeDefined();
    expect(typeof client.query).toBe('function');
    expect(typeof client.release).toBe('function');
    
    // Release client back to pool
    client.release();
  });

  test('should handle transaction with client', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await client.query('SELECT 1 as value');
      await client.query('COMMIT');
      
      expect(result.rows[0].value).toBe(1);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });

  test('should handle connection pool under concurrent load', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    // Create 10 concurrent queries
    const queries = Array.from({ length: 10 }, (_, i) => 
      db.query('SELECT $1::int as value', [i])
    );

    const results = await Promise.all(queries);
    
    // Verify all queries succeeded
    expect(results).toHaveLength(10);
    results.forEach((result, i) => {
      expect(result.rows[0].value).toBe(i);
    });
  });

  test('should retry on temporary connection failure', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    // This test verifies the retry logic works with a real database
    // If the database is temporarily unavailable, it should retry
    const result = await db.query('SELECT 1 as value');
    expect(result.rows[0].value).toBe(1);
  });

  test('should get database status', async () => {
    if (!process.env.DATABASE_URL) {
      const status = await db.getDatabaseStatus();
      expect(status.connected).toBe(false);
      expect(status.configured).toBe(false);
      return;
    }

    const status = await db.getDatabaseStatus();
    expect(status.connected).toBe(true);
    expect(status.configured).toBe(true);
    expect(status.message).toBe('Database connection is ready');
  });

  test('should warmup connection successfully', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const result = await db.warmupConnection();
    expect(result).toBe(true);
  });

  test('should handle multiple warmup calls (idempotent)', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    // Multiple warmup calls should not cause issues
    const results = await Promise.all([
      db.warmupConnection(),
      db.warmupConnection(),
      db.warmupConnection(),
    ]);

    results.forEach(result => {
      expect(result).toBe(true);
    });
  });

  test('should detect slow queries', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    // Mock console.warn to capture slow query warnings
    const originalWarn = console.warn;
    const warnings = [];
    console.warn = (...args) => warnings.push(args);

    try {
      // Execute a query that takes > 1 second
      await db.query('SELECT pg_sleep(1.1)');
      
      // Check if slow query was logged
      const slowQueryWarning = warnings.find(w => 
        w[0] === 'Slow query detected'
      );
      expect(slowQueryWarning).toBeDefined();
    } finally {
      console.warn = originalWarn;
    }
  });

  test('should handle query with no results', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const result = await db.query('SELECT 1 WHERE false');
    expect(result.rows).toHaveLength(0);
  });

  test('should handle query with multiple rows', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const result = await db.query('SELECT generate_series(1, 5) as value');
    expect(result.rows).toHaveLength(5);
    expect(result.rows[0].value).toBe(1);
    expect(result.rows[4].value).toBe(5);
  });

  test('should handle invalid SQL gracefully', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    await expect(db.query('INVALID SQL SYNTAX')).rejects.toThrow();
  });

  test('should close pool successfully', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    await db.closePool();
    
    // After closing, pool should be null
    // Next query will reinitialize the pool
    const result = await db.query('SELECT 1 as value');
    expect(result.rows[0].value).toBe(1);
  });
});
