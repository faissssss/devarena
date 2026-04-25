import bcrypt from 'bcrypt';

import { query } from '../utils/db.js';

export async function getUserById(id) {
  const result = await query(
    `SELECT id, username, email, role, created_at FROM users WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function updateCurrentUser(userId, updates) {
  const result = await query(
    `UPDATE users
     SET username = COALESCE($2, username),
         email = COALESCE($3, email),
         password_hash = COALESCE($4, password_hash)
     WHERE id = $1
     RETURNING id, username, email, role, created_at`,
    [userId, updates.username ?? null, updates.email ?? null, updates.passwordHash ?? null]
  );

  return result.rows[0] ?? null;
}

export async function changePassword(userId, currentPassword, nextPassword) {
  const result = await query(`SELECT id, password_hash FROM users WHERE id = $1`, [userId]);

  const user = result.rows[0];
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const matches = await bcrypt.compare(currentPassword, user.password_hash);
  if (!matches) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(nextPassword, 10);
  return updateCurrentUser(userId, { passwordHash });
}
