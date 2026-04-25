import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { query } from '../utils/db.js';

const DEFAULT_SALT_ROUNDS = 10;
const DEFAULT_TOKEN_EXPIRES_IN = '7d';

export class AuthServiceError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.name = 'AuthServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new AuthServiceError(
      'JWT_SECRET environment variable is required',
      'MISSING_JWT_SECRET',
      500
    );
  }

  return process.env.JWT_SECRET;
}

function sanitizeUser(userRow) {
  if (!userRow) {
    return null;
  }

  const user = { ...userRow };
  delete user.password_hash;
  return user;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, DEFAULT_SALT_ROUNDS);
}

export async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function generateToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_TOKEN_EXPIRES_IN,
  });
}

export function validateToken(token) {
  return jwt.verify(token, getJwtSecret());
}

export async function register({ username, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  try {
    const result = await query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, username, email, role, created_at`,
      [username.trim(), normalizedEmail, passwordHash]
    );

    return sanitizeUser(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      const conflictField = error.constraint?.includes('email')
        ? 'email'
        : error.constraint?.includes('username')
          ? 'username'
          : 'user';

      throw new AuthServiceError(
        `${conflictField} already exists`,
        'DUPLICATE_USER',
        409
      );
    }

    throw error;
  }
}

export async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await query(
    `SELECT id, username, email, password_hash, role, created_at
     FROM users
     WHERE email = $1`,
    [normalizedEmail]
  );

  const user = result.rows[0];
  if (!user) {
    throw new AuthServiceError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
  }

  const isValidPassword = await comparePassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new AuthServiceError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
  }

  const sanitizedUser = sanitizeUser(user);
  const token = generateToken({
    userId: sanitizedUser.id,
    role: sanitizedUser.role,
  });

  return {
    token,
    user: sanitizedUser,
  };
}

export default {
  hashPassword,
  comparePassword,
  generateToken,
  validateToken,
  register,
  login,
};
