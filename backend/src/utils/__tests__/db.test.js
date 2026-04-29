import { jest } from '@jest/globals';

// Mock pg module
const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockEnd = jest.fn();
const mockOn = jest.fn();

const mockPool = {
  query: mockQuery,
  connect: mockConnect,
  end: mockEnd,
  on: mockOn,
};

jest.unstable_mockModule('pg', () => ({
  default: {
    Pool: jest.fn(() => mockPool),
  },
  Pool: jest.fn(() => mockPool),
}));

// Import after mocking
const { 
  initializePool, 
  getPool, 
  query, 
  closePool,
  warmupConnection,
  getDatabaseStatus,
  isDatabaseConfigured 
} = await import('../db.js');

describe('Database Connection Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
  });

  afterEach(async () => {
    // Clean up pool between tests
    try {
      await closePool();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Connection Pool Initialization', () => {
    test('should initialize pool with Railway settings', () => {
      const pool = initializePool();
      
      expect(pool).toBeDefined();
      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('remove', expect.any(Function));
    });

    test('should use 20 connections for Railway', () => {
      const pg = require('pg');
      initializePool();
      
      const poolConfig = pg.Pool.mock.calls[0][0];
      expect(poolConfig.max).toBe(20);
    });

    test('should configure connection timeouts', () => {
      const pg = require('pg');
      initializePool();
      
      const poolConfig = pg.Pool.mock.calls[0][0];
      expect(poolConfig.idleTimeoutMillis).toBe(60000);
      expect(poolConfig.connectionTimeoutMillis).toBe(30000);
      expect(poolConfig.statement_timeout).toBe(30000);
    });

    test('should throw error if DATABASE_URL not configured', () => {
      delete process.env.DATABASE_URL;
      
      expect(() => initializePool()).toThrow('DATABASE_URL environment variable is required');
    });

    test('should return existing pool if already initialized', () => {
      const pool1 = initializePool();
      const pool2 = getPool();
      
      expect(pool1).toBe(pool2);
    });
  });

  describe('Retry Logic with Mock Connection Failures', () => {
    test('should retry on ECONNREFUSED error', async () => {
      const connectionError = new Error('Connection refused');
      connectionError.code = 'ECONNREFUSED';
      
      mockQuery
        .mockRejectedValueOnce(connectionError)
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce({ rows: [{ result: 'success' }] });

      const result = await query('SELECT 1');
      
      expect(result.rows[0].result).toBe('success');
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    test('should retry on ETIMEDOUT error', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.code = 'ETIMEDOUT';
      
      mockQuery
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce({ rows: [{ result: 'success' }] });

      const result = await query('SELECT 1');
      
      expect(result.rows[0].result).toBe('success');
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    test('should retry on connection terminated error', async () => {
      const terminatedError = new Error('Connection terminated unexpectedly');
      
      mockQuery
        .mockRejectedValueOnce(terminatedError)
        .mockResolvedValueOnce({ rows: [{ result: 'success' }] });

      const result = await query('SELECT 1');
      
      expect(result.rows[0].result).toBe('success');
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    test('should fail after max retries (5 attempts)', async () => {
      const connectionError = new Error('Connection refused');
      connectionError.code = 'ECONNREFUSED';
      
      mockQuery.mockRejectedValue(connectionError);

      await expect(query('SELECT 1')).rejects.toThrow('Connection refused');
      
      // Initial attempt + 5 retries = 6 total calls
      expect(mockQuery).toHaveBeenCalledTimes(6);
    });

    test('should use exponential backoff for retries', async () => {
      const connectionError = new Error('Connection refused');
      connectionError.code = 'ECONNREFUSED';
      
      const startTime = Date.now();
      
      mockQuery
        .mockRejectedValueOnce(connectionError)
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce({ rows: [{ result: 'success' }] });

      await query('SELECT 1');
      
      const duration = Date.now() - startTime;
      
      // First retry: 2000ms, second retry: 4000ms = 6000ms total minimum
      // Allow some tolerance for test execution time
      expect(duration).toBeGreaterThanOrEqual(5900);
    });

    test('should not retry on non-retryable errors', async () => {
      const syntaxError = new Error('Syntax error');
      syntaxError.code = '42601';
      
      mockQuery.mockRejectedValueOnce(syntaxError);

      await expect(query('SELECT invalid')).rejects.toThrow('Syntax error');
      
      // Should only attempt once (no retries)
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('Connection Timeout Handling', () => {
    test('should handle connection timeout', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.code = 'ETIMEDOUT';
      
      mockQuery.mockRejectedValue(timeoutError);

      await expect(query('SELECT 1')).rejects.toThrow('Connection timeout');
    });

    test('should handle DNS lookup failure', async () => {
      const dnsError = new Error('DNS lookup failed');
      dnsError.code = 'ENOTFOUND';
      
      mockQuery
        .mockRejectedValueOnce(dnsError)
        .mockResolvedValueOnce({ rows: [{ result: 'success' }] });

      const result = await query('SELECT 1');
      
      expect(result.rows[0].result).toBe('success');
    });
  });

  describe('Database Status', () => {
    test('should return not configured when DATABASE_URL missing', async () => {
      delete process.env.DATABASE_URL;
      
      const status = await getDatabaseStatus();
      
      expect(status.connected).toBe(false);
      expect(status.configured).toBe(false);
      expect(status.message).toBe('DATABASE_URL is not configured');
    });

    test('should return connected when warmup succeeds', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ result: 1 }] });
      
      const status = await getDatabaseStatus();
      
      expect(status.connected).toBe(true);
      expect(status.configured).toBe(true);
      expect(status.message).toBe('Database connection is ready');
    });

    test('should return not connected when warmup fails', async () => {
      const connectionError = new Error('Connection refused');
      connectionError.code = 'ECONNREFUSED';
      mockQuery.mockRejectedValue(connectionError);
      
      const status = await getDatabaseStatus();
      
      expect(status.connected).toBe(false);
      expect(status.configured).toBe(true);
      expect(status.message).toContain('Connection refused');
    });
  });

  describe('isDatabaseConfigured', () => {
    test('should return true when DATABASE_URL is set', () => {
      expect(isDatabaseConfigured()).toBe(true);
    });

    test('should return false when DATABASE_URL is not set', () => {
      delete process.env.DATABASE_URL;
      expect(isDatabaseConfigured()).toBe(false);
    });
  });
});
