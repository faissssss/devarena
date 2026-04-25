/**
 * Database Migration Tests
 * 
 * Tests verify that database migrations create the correct schema with all
 * required tables, columns, constraints, and indexes.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrationSuite = process.env.TEST_DATABASE_URL ? describe : describe.skip;

runMigrationSuite('Database Migrations', () => {
  let pool;
  const testDbUrl = process.env.TEST_DATABASE_URL;

  beforeAll(async () => {
    pool = new Pool({ connectionString: testDbUrl });

    // Clean up existing tables
    await pool.query('DROP TABLE IF EXISTS bookmarks CASCADE');
    await pool.query('DROP TABLE IF EXISTS sync_logs CASCADE');
    await pool.query('DROP TABLE IF EXISTS competitions CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');

    // Run migrations
    const migrationsDir = path.join(__dirname, '../../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const filepath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filepath, 'utf8');
      await pool.query(sql);
    }
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  describe('Users Table (Requirement 10.2)', () => {
    test('should create users table with correct columns', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('username');
      expect(columns).toContain('email');
      expect(columns).toContain('password_hash');
      expect(columns).toContain('role');
      expect(columns).toContain('created_at');
    });

    test('should have unique constraints on username and email', async () => {
      const result = await pool.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'users' AND constraint_type = 'UNIQUE'
      `);

      expect(result.rows.length).toBeGreaterThanOrEqual(2);
    });

    test('should have check constraint for valid role', async () => {
      const result = await pool.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'users' AND constraint_type = 'CHECK'
        AND constraint_name = 'valid_role'
      `);

      expect(result.rows.length).toBe(1);
    });

    test('should have indexes on email and username', async () => {
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'users'
      `);

      const indexes = result.rows.map(row => row.indexname);
      expect(indexes).toContain('idx_users_email');
      expect(indexes).toContain('idx_users_username');
    });
  });

  describe('Competitions Table (Requirement 10.3)', () => {
    test('should create competitions table with correct columns', async () => {
      const result = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'competitions'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('title');
      expect(columns).toContain('description');
      expect(columns).toContain('category');
      expect(columns).toContain('platform');
      expect(columns).toContain('url');
      expect(columns).toContain('start_date');
      expect(columns).toContain('end_date');
      expect(columns).toContain('status');
      expect(columns).toContain('location');
      expect(columns).toContain('prize');
      expect(columns).toContain('difficulty');
      expect(columns).toContain('source');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    test('should have check constraints for category, status, and dates', async () => {
      const result = await pool.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'competitions' AND constraint_type = 'CHECK'
      `);

      const constraints = result.rows.map(row => row.constraint_name);
      expect(constraints).toContain('valid_category');
      expect(constraints).toContain('valid_status');
      expect(constraints).toContain('valid_dates');
    });

    test('should have unique constraint on (title, platform, start_date)', async () => {
      const result = await pool.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'competitions' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name = 'unique_competition'
      `);

      expect(result.rows.length).toBe(1);
    });

    test('should have index on category (Requirement 10.8)', async () => {
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'competitions' AND indexname = 'idx_competitions_category'
      `);

      expect(result.rows.length).toBe(1);
    });

    test('should have index on status (Requirement 10.9)', async () => {
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'competitions' AND indexname = 'idx_competitions_status'
      `);

      expect(result.rows.length).toBe(1);
    });

    test('should have index on start_date (Requirement 10.10)', async () => {
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'competitions' AND indexname = 'idx_competitions_start_date'
      `);

      expect(result.rows.length).toBe(1);
    });
  });

  describe('Bookmarks Table (Requirement 10.4)', () => {
    test('should create bookmarks table with correct columns', async () => {
      const result = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'bookmarks'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('competition_id');
      expect(columns).toContain('created_at');
    });

    test('should have foreign key constraint on user_id (Requirement 10.6)', async () => {
      const result = await pool.query(`
        SELECT constraint_name, table_name
        FROM information_schema.table_constraints
        WHERE table_name = 'bookmarks' 
        AND constraint_type = 'FOREIGN KEY'
      `);

      expect(result.rows.length).toBeGreaterThanOrEqual(1);
    });

    test('should have foreign key constraint on competition_id (Requirement 10.7)', async () => {
      const result = await pool.query(`
        SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'bookmarks' 
        AND tc.constraint_type = 'FOREIGN KEY'
      `);

      const foreignTables = result.rows.map(row => row.foreign_table_name);
      expect(foreignTables).toContain('users');
      expect(foreignTables).toContain('competitions');
    });

    test('should have cascade delete on foreign keys', async () => {
      const result = await pool.query(`
        SELECT rc.delete_rule
        FROM information_schema.referential_constraints rc
        WHERE rc.constraint_name IN (
          SELECT constraint_name
          FROM information_schema.table_constraints
          WHERE table_name = 'bookmarks' AND constraint_type = 'FOREIGN KEY'
        )
      `);

      result.rows.forEach(row => {
        expect(row.delete_rule).toBe('CASCADE');
      });
    });

    test('should have unique constraint on (user_id, competition_id)', async () => {
      const result = await pool.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'bookmarks' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name = 'unique_bookmark'
      `);

      expect(result.rows.length).toBe(1);
    });

    test('should have indexes on user_id and competition_id', async () => {
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'bookmarks'
      `);

      const indexes = result.rows.map(row => row.indexname);
      expect(indexes).toContain('idx_bookmarks_user_id');
      expect(indexes).toContain('idx_bookmarks_competition_id');
    });
  });

  describe('Sync Logs Table (Requirement 10.5)', () => {
    test('should create sync_logs table with correct columns', async () => {
      const result = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'sync_logs'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('source');
      expect(columns).toContain('status');
      expect(columns).toContain('record_count');
      expect(columns).toContain('error_message');
      expect(columns).toContain('synced_at');
    });

    test('should have check constraint for valid status', async () => {
      const result = await pool.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'sync_logs' 
        AND constraint_type = 'CHECK'
        AND constraint_name = 'valid_sync_status'
      `);

      expect(result.rows.length).toBe(1);
    });

    test('should have indexes on synced_at and source', async () => {
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'sync_logs'
      `);

      const indexes = result.rows.map(row => row.indexname);
      expect(indexes).toContain('idx_sync_logs_synced_at');
      expect(indexes).toContain('idx_sync_logs_source');
    });
  });

  describe('Integration Tests', () => {
    test('should insert and retrieve a user', async () => {
      const result = await pool.query(`
        INSERT INTO users (username, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, role
      `, ['testuser', 'test@example.com', 'hashedpassword', 'user']);

      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0].username).toBe('testuser');
      expect(result.rows[0].email).toBe('test@example.com');
      expect(result.rows[0].role).toBe('user');
    });

    test('should enforce unique constraint on email', async () => {
      await expect(
        pool.query(`
          INSERT INTO users (username, email, password_hash, role)
          VALUES ($1, $2, $3, $4)
        `, ['testuser2', 'test@example.com', 'hashedpassword', 'user'])
      ).rejects.toThrow();
    });

    test('should insert and retrieve a competition', async () => {
      const result = await pool.query(`
        INSERT INTO competitions (
          title, category, platform, url, start_date, end_date, status, source
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, title, category, status
      `, [
        'Test Competition',
        'Hackathons',
        'TestPlatform',
        'https://example.com',
        '2024-12-01',
        '2024-12-31',
        'upcoming',
        'kontests'
      ]);

      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0].title).toBe('Test Competition');
      expect(result.rows[0].category).toBe('Hackathons');
    });

    test('should create bookmark with foreign keys', async () => {
      // Get user and competition IDs
      const user = await pool.query('SELECT id FROM users LIMIT 1');
      const competition = await pool.query('SELECT id FROM competitions LIMIT 1');

      const result = await pool.query(`
        INSERT INTO bookmarks (user_id, competition_id)
        VALUES ($1, $2)
        RETURNING id, user_id, competition_id
      `, [user.rows[0].id, competition.rows[0].id]);

      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0].user_id).toBe(user.rows[0].id);
      expect(result.rows[0].competition_id).toBe(competition.rows[0].id);
    });

    test('should cascade delete bookmarks when user is deleted', async () => {
      // Create a test user
      const userResult = await pool.query(`
        INSERT INTO users (username, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, ['deletetest', 'delete@example.com', 'hashedpassword', 'user']);

      const userId = userResult.rows[0].id;

      // Get a competition
      const competition = await pool.query('SELECT id FROM competitions LIMIT 1');

      // Create bookmark
      await pool.query(`
        INSERT INTO bookmarks (user_id, competition_id)
        VALUES ($1, $2)
      `, [userId, competition.rows[0].id]);

      // Delete user
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);

      // Check bookmark was deleted
      const bookmarkCheck = await pool.query(
        'SELECT * FROM bookmarks WHERE user_id = $1',
        [userId]
      );

      expect(bookmarkCheck.rows.length).toBe(0);
    });

    test('should insert sync log', async () => {
      const result = await pool.query(`
        INSERT INTO sync_logs (source, status, record_count)
        VALUES ($1, $2, $3)
        RETURNING id, source, status, record_count
      `, ['kontests', 'success', 42]);

      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0].source).toBe('kontests');
      expect(result.rows[0].status).toBe('success');
      expect(result.rows[0].record_count).toBe(42);
    });
  });
});
