import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../utils/db.js', () => ({
  query: mockQuery,
}));

describe('authService', () => {
  let authService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    process.env.JWT_SECRET = 'test-secret-key-with-more-than-32-characters';
    process.env.JWT_EXPIRES_IN = '7d';

    authService = await import('../authService.js');
  });

  test('hashPassword produces a valid bcrypt hash', async () => {
    const hash = await authService.hashPassword('super-secret-password');

    expect(hash).toMatch(/^\$2[aby]\$.{56}$/);
    expect(await bcrypt.compare('super-secret-password', hash)).toBe(true);
  });

  test('comparePassword accepts matches and rejects mismatches', async () => {
    const hash = await bcrypt.hash('correct-password', 10);

    await expect(
      authService.comparePassword('correct-password', hash)
    ).resolves.toBe(true);
    await expect(authService.comparePassword('wrong-password', hash)).resolves.toBe(
      false
    );
  });

  test('generateToken encodes the expected JWT payload', () => {
    const token = authService.generateToken({ userId: 'user-1', role: 'admin' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.userId).toBe('user-1');
    expect(decoded.role).toBe('admin');
    expect(decoded.exp).toBeDefined();
  });

  test('validateToken accepts valid tokens', () => {
    const token = jwt.sign(
      { userId: 'user-2', role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    expect(authService.validateToken(token)).toEqual(
      expect.objectContaining({
        userId: 'user-2',
        role: 'user',
      })
    );
  });

  test('validateToken rejects expired tokens', () => {
    const token = jwt.sign(
      { userId: 'user-3', role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: -1 }
    );

    expect(() => authService.validateToken(token)).toThrow('jwt expired');
  });

  test('validateToken rejects tampered tokens', () => {
    const token = authService.generateToken({ userId: 'user-4', role: 'user' });
    const tamperedToken = `${token.slice(0, -1)}x`;

    expect(() => authService.validateToken(tamperedToken)).toThrow();
  });

  test('register hashes the password, inserts the user, and omits password_hash', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 'user-5',
          username: 'alice',
          email: 'alice@example.com',
          role: 'user',
          created_at: '2026-04-25T00:00:00.000Z',
        },
      ],
    });

    const user = await authService.register({
      username: 'alice',
      email: 'Alice@Example.com',
      password: 'super-secret-password',
    });

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery.mock.calls[0][0]).toContain('INSERT INTO users');
    expect(mockQuery.mock.calls[0][1][0]).toBe('alice');
    expect(mockQuery.mock.calls[0][1][1]).toBe('alice@example.com');
    expect(mockQuery.mock.calls[0][1][2]).toMatch(/^\$2[aby]\$.{56}$/);
    expect(user).toEqual({
      id: 'user-5',
      username: 'alice',
      email: 'alice@example.com',
      role: 'user',
      created_at: '2026-04-25T00:00:00.000Z',
    });
  });

  test('register throws a conflict error for duplicate users', async () => {
    const duplicateError = new Error('duplicate key value violates unique constraint');
    duplicateError.code = '23505';
    duplicateError.constraint = 'users_email_key';
    mockQuery.mockRejectedValue(duplicateError);

    await expect(
      authService.register({
        username: 'alice',
        email: 'alice@example.com',
        password: 'super-secret-password',
      })
    ).rejects.toMatchObject({
      code: 'DUPLICATE_USER',
      statusCode: 409,
      message: 'email already exists',
    });
  });

  test('login returns a token and sanitized user for valid credentials', async () => {
    const passwordHash = await bcrypt.hash('super-secret-password', 10);
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 'user-6',
          username: 'bob',
          email: 'bob@example.com',
          password_hash: passwordHash,
          role: 'user',
          created_at: '2026-04-25T00:00:00.000Z',
        },
      ],
    });

    const result = await authService.login({
      email: 'BOB@example.com',
      password: 'super-secret-password',
    });

    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE email = $1'), [
      'bob@example.com',
    ]);
    expect(result.user).toEqual({
      id: 'user-6',
      username: 'bob',
      email: 'bob@example.com',
      role: 'user',
      created_at: '2026-04-25T00:00:00.000Z',
    });
    expect(jwt.verify(result.token, process.env.JWT_SECRET)).toEqual(
      expect.objectContaining({
        userId: 'user-6',
        role: 'user',
      })
    );
  });

  test('login rejects unknown users', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await expect(
      authService.login({
        email: 'missing@example.com',
        password: 'super-secret-password',
      })
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
    });
  });

  test('login rejects password mismatches', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 'user-7',
          username: 'charlie',
          email: 'charlie@example.com',
          password_hash: await bcrypt.hash('correct-password', 10),
          role: 'user',
          created_at: '2026-04-25T00:00:00.000Z',
        },
      ],
    });

    await expect(
      authService.login({
        email: 'charlie@example.com',
        password: 'wrong-password',
      })
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
    });
  });
});
