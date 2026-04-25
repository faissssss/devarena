/**
 * Integration tests for database connection module
 * These tests require a running PostgreSQL database
 * Run with: node --experimental-vm-modules node_modules/.bin/jest db.integration.test.js
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
    await db.closePool();
  });

  test('should connect to database successfully', async () => {
    if (!process.env.DATABASE_URL) {
      return; // Skip if no database configured
    }

    const result = await db.testConnection();
    expect(result).toBe(true);
  });

  test('should execute simple query', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const result = await db.query('SELECT 1 as number');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].number).toBe(1);
  });

  test('should execute parameterized query', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const result = await db.query('SELECT $1::text as value', ['test']);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].value).toBe('test');
  });

  test('should get client from pool', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const client = await db.getClient();
    expect(client).toBeDefined();
    expect(client.query).toBeDefined();
    expect(client.release).toBeDefined();

    // Clean up
    client.release();
  });

  test('should handle transaction with client', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const client = await db.getClient();

    try {
      await client.query('BEGIN');
      const result = await client.query('SELECT 1 as number');
      await client.query('COMMIT');

      expect(result.rows[0].number).toBe(1);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });
});
