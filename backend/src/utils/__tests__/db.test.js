import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
};

const MockPool = jest.fn(() => mockPool);

jest.unstable_mockModule('pg', () => ({
  default: {
    Pool: MockPool,
  },
}));

jest.unstable_mockModule('dotenv', () => ({
  default: {
    config: jest.fn(),
  },
}));

describe('Database Connection Module', () => {
  let db;
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.DATABASE_URL =
      'postgresql://user:password@localhost:5432/devarena_test';
    process.env.SYNC_RETRIES = '3';
    db = await import('../db.js');
  });

  afterEach(async () => {
    // Clean up
    if (db.closePool) {
      await db.closePool();
    }
  });

  test('initializePool creates a configured pool', () => {
    db.initializePool();

    expect(MockPool).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      })
    );
    expect(mockPool.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockPool.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockPool.on).toHaveBeenCalledWith('remove', expect.any(Function));
  });

  test('initializePool throws when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    expect(() => db.initializePool()).toThrow(
      'DATABASE_URL environment variable is required'
    );
  });

  test('getPool reuses the initialized pool', () => {
    const pool1 = db.getPool();
    const pool2 = db.getPool();
    expect(pool1).toBe(pool2);
    expect(MockPool).toHaveBeenCalledTimes(1);
  });

  test('isDatabaseConfigured reflects DATABASE_URL presence', () => {
    expect(db.isDatabaseConfigured()).toBe(true);
    delete process.env.DATABASE_URL;
    expect(db.isDatabaseConfigured()).toBe(false);
  });

  test('query executes successfully', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 });
    const result = await db.query('SELECT * FROM users WHERE id = $1', [1]);
    expect(result.rows[0].id).toBe(1);
    expect(mockPool.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE id = $1',
      [1]
    );
  });

  test('query retries retryable errors', async () => {
    const connectionError = new Error('Connection refused');
    connectionError.code = 'ECONNREFUSED';
    mockPool.query
      .mockRejectedValueOnce(connectionError)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await db.query('SELECT 1');
    expect(mockPool.query).toHaveBeenCalledTimes(2);
  });

  test('query does not retry non-retryable errors', async () => {
    const syntaxError = new Error('syntax error at or near "SELEC"');
    syntaxError.code = '42601';
    mockPool.query.mockRejectedValueOnce(syntaxError);

    await expect(db.query('SELEC * FROM users')).rejects.toThrow('syntax error');
    expect(mockPool.query).toHaveBeenCalledTimes(1);
  });

  test('getClient resolves a pool client', async () => {
    const client = { query: jest.fn(), release: jest.fn() };
    mockPool.connect.mockResolvedValueOnce(client);
    await expect(db.getClient()).resolves.toBe(client);
  });

  test('testConnection returns true on success', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ current_time: new Date().toISOString() }],
      rowCount: 1,
    });
    await expect(db.testConnection()).resolves.toBe(true);
  });

  test('testConnection returns false on failure', async () => {
    const error = new Error('Connection refused');
    error.code = 'ECONNREFUSED';
    mockPool.query.mockRejectedValueOnce(error);
    await expect(db.testConnection()).resolves.toBe(false);
  });

  test('warmupConnection reuses a single in-flight connection check', async () => {
    mockPool.query.mockResolvedValue({ rows: [], rowCount: 1 });

    await Promise.all([db.warmupConnection(), db.warmupConnection()]);

    expect(mockPool.query).toHaveBeenCalledTimes(1);
    expect(mockPool.query).toHaveBeenCalledWith('SELECT 1');
  });

  test('getDatabaseStatus reports missing configuration', async () => {
    delete process.env.DATABASE_URL;

    await expect(db.getDatabaseStatus()).resolves.toEqual(
      expect.objectContaining({
        connected: false,
        configured: false,
      })
    );
  });

  test('closePool shuts down the pool', async () => {
    db.initializePool();
    mockPool.end.mockResolvedValueOnce();
    await db.closePool();
    expect(mockPool.end).toHaveBeenCalled();
  });
});
