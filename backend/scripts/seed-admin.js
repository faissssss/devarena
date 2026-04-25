import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

import { query, closePool } from '../src/utils/db.js';

dotenv.config();

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const email = process.env.ADMIN_EMAIL || 'admin@devarena.local';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

  const passwordHash = await bcrypt.hash(password, 10);

  await query(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email)
     DO UPDATE SET
       username = EXCLUDED.username,
       password_hash = EXCLUDED.password_hash,
       role = 'admin'`,
    [username, email.toLowerCase(), passwordHash]
  );

  console.log(`Admin user seeded for ${email}`);
}

seedAdmin()
  .catch((error) => {
    console.error('Failed to seed admin user:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
