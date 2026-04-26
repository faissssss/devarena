/**
 * Database Migration Runner
 * 
 * This script runs all SQL migration files in order to set up the DevArena database schema.
 * It reads migration files from the migrations directory and executes them sequentially.
 * 
 * Usage:
 *   node backend/migrations/run-migrations.js
 * 
 * Prerequisites:
 *   - DATABASE_URL environment variable set in .env file
 *   - PostgreSQL database created
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pg;

// Get current directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Get all migration files sorted by name
 */
function getMigrationFiles() {
  const files = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  return files;
}

/**
 * Run a single migration file
 */
async function runMigration(filename) {
  const filepath = path.join(__dirname, filename);
  const sql = fs.readFileSync(filepath, 'utf8');
  
  console.log(`Running migration: ${filename}`);
  
  try {
    await pool.query(sql);
    console.log(`✓ Successfully executed: ${filename}`);
    return { success: true, filename };
  } catch (error) {
    console.error(`✗ Failed to execute: ${filename}`);
    console.error(`Error: ${error.message}`);
    return { success: false, filename, error: error.message };
  }
}

/**
 * Run all migrations
 */
async function runAllMigrations() {
  console.log('Starting database migrations...\n');
  
  // Check database connection
  try {
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful\n');
  } catch (error) {
    console.error('✗ Database connection failed');
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
  
  const migrationFiles = getMigrationFiles();
  
  if (migrationFiles.length === 0) {
    console.log('No migration files found.');
    return;
  }
  
  console.log(`Found ${migrationFiles.length} migration file(s):\n`);
  
  const results = [];
  
  for (const file of migrationFiles) {
    const result = await runMigration(file);
    results.push(result);
    console.log(''); // Empty line for readability
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('Migration Summary:');
  console.log(`  Total: ${results.length}`);
  console.log(`  Successful: ${successful}`);
  console.log(`  Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed migrations:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.filename}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✓ All migrations completed successfully!');
  }
}

/**
 * Verify schema after migrations
 */
async function verifySchema() {
  console.log('\nVerifying database schema...\n');
  
  const tables = ['users', 'competitions', 'bookmarks', 'sync_logs'];
  
  for (const table of tables) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
        [table]
      );
      
      if (result.rows[0].count === '1') {
        console.log(`✓ Table '${table}' exists`);
      } else {
        console.log(`✗ Table '${table}' not found`);
      }
    } catch (error) {
      console.error(`✗ Error checking table '${table}': ${error.message}`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await runAllMigrations();
    await verifySchema();
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if executed directly (handles both Unix and Windows path formats)
const scriptUrl = import.meta.url;
const argUrl = new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href;
if (scriptUrl === argUrl || process.argv[1].endsWith('run-migrations.js')) {
  main();
}

async function closeMigrationPool() {
  await pool.end();
}

export { runAllMigrations, runMigration, verifySchema, closeMigrationPool };
