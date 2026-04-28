/**
 * Production Database Verification Script
 * 
 * This script verifies that the production Supabase database is properly set up:
 * - Checks database connection
 * - Verifies all required tables exist
 * - Checks data exists in competitions table
 * - Verifies connection pooling settings
 * 
 * Usage:
 *   DATABASE_URL="your_production_url" node backend/migrations/verify-production-db.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Check database connection
 */
async function checkConnection() {
  console.log('1. Checking database connection...');
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('   ✓ Connection successful');
    console.log(`   ✓ PostgreSQL version: ${result.rows[0].pg_version.split(',')[0]}`);
    console.log(`   ✓ Current time: ${result.rows[0].current_time}`);
    return true;
  } catch (error) {
    console.error('   ✗ Connection failed');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Verify all required tables exist
 */
async function verifyTables() {
  console.log('\n2. Verifying required tables...');
  
  const requiredTables = ['users', 'competitions', 'bookmarks', 'sync_logs', 'user_oauth_accounts'];
  const results = [];
  
  for (const table of requiredTables) {
    try {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      
      const exists = result.rows[0].exists;
      results.push({ table, exists });
      
      if (exists) {
        console.log(`   ✓ Table '${table}' exists`);
      } else {
        console.log(`   ✗ Table '${table}' NOT FOUND`);
      }
    } catch (error) {
      console.error(`   ✗ Error checking table '${table}': ${error.message}`);
      results.push({ table, exists: false, error: error.message });
    }
  }
  
  const allExist = results.every(r => r.exists);
  return { allExist, results };
}

/**
 * Check data exists in competitions table
 */
async function checkCompetitionsData() {
  console.log('\n3. Checking competitions data...');
  
  try {
    // Check if table exists first
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'competitions'
      )`
    );
    
    if (!tableCheck.rows[0].exists) {
      console.log('   ✗ Competitions table does not exist');
      return { exists: false, count: 0 };
    }
    
    // Count records
    const countResult = await pool.query('SELECT COUNT(*) as count FROM competitions');
    const count = parseInt(countResult.rows[0].count);
    
    console.log(`   ✓ Competitions table has ${count} records`);
    
    if (count === 0) {
      console.log('   ⚠ WARNING: Competitions table is empty');
      console.log('   → You need to run a data sync to populate competitions');
      console.log('   → Use: npm run sync or visit /api/admin/sync endpoint');
    } else if (count < 519) {
      console.log(`   ⚠ WARNING: Expected ~519 records, found ${count}`);
      console.log('   → Consider running a full data sync');
    } else {
      console.log('   ✓ Data looks good!');
    }
    
    // Get sample data
    const sampleResult = await pool.query(
      'SELECT title, platform, category, start_date FROM competitions LIMIT 3'
    );
    
    if (sampleResult.rows.length > 0) {
      console.log('\n   Sample competitions:');
      sampleResult.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. ${row.title} (${row.platform}) - ${row.category}`);
      });
    }
    
    return { exists: true, count };
  } catch (error) {
    console.error('   ✗ Error checking competitions data');
    console.error(`   Error: ${error.message}`);
    return { exists: false, count: 0, error: error.message };
  }
}

/**
 * Check database configuration
 */
async function checkDatabaseConfig() {
  console.log('\n4. Checking database configuration...');
  
  try {
    // Check max connections
    const maxConnResult = await pool.query('SHOW max_connections');
    console.log(`   ✓ Max connections: ${maxConnResult.rows[0].max_connections}`);
    
    // Check current connections
    const currentConnResult = await pool.query(
      `SELECT count(*) as active_connections 
       FROM pg_stat_activity 
       WHERE state = 'active'`
    );
    console.log(`   ✓ Active connections: ${currentConnResult.rows[0].active_connections}`);
    
    // Check database size
    const sizeResult = await pool.query(
      `SELECT pg_size_pretty(pg_database_size(current_database())) as size`
    );
    console.log(`   ✓ Database size: ${sizeResult.rows[0].size}`);
    
    return true;
  } catch (error) {
    console.error('   ✗ Error checking database configuration');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Check indexes
 */
async function checkIndexes() {
  console.log('\n5. Checking indexes...');
  
  try {
    const result = await pool.query(`
      SELECT 
        tablename, 
        indexname, 
        indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'competitions', 'bookmarks', 'sync_logs', 'user_oauth_accounts')
      ORDER BY tablename, indexname
    `);
    
    if (result.rows.length === 0) {
      console.log('   ⚠ No indexes found');
      return false;
    }
    
    console.log(`   ✓ Found ${result.rows.length} indexes`);
    
    // Group by table
    const indexesByTable = {};
    result.rows.forEach(row => {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push(row.indexname);
    });
    
    Object.entries(indexesByTable).forEach(([table, indexes]) => {
      console.log(`   ✓ ${table}: ${indexes.length} indexes`);
    });
    
    return true;
  } catch (error) {
    console.error('   ✗ Error checking indexes');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Generate summary report
 */
function generateSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  
  const allChecks = [
    { name: 'Database Connection', passed: results.connection },
    { name: 'All Tables Exist', passed: results.tables.allExist },
    { name: 'Competitions Data', passed: results.competitions.count > 0 },
    { name: 'Database Config', passed: results.config },
    { name: 'Indexes', passed: results.indexes },
  ];
  
  allChecks.forEach(check => {
    const status = check.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status} - ${check.name}`);
  });
  
  console.log('='.repeat(60));
  
  const allPassed = allChecks.every(c => c.passed);
  
  if (allPassed) {
    console.log('\n✓ ALL CHECKS PASSED!');
    console.log('Your production database is properly configured.');
  } else {
    console.log('\n⚠ SOME CHECKS FAILED');
    console.log('Please review the errors above and take corrective action.');
    
    if (!results.tables.allExist) {
      console.log('\n→ ACTION REQUIRED: Run database migrations');
      console.log('  Command: node backend/migrations/run-migrations.js');
    }
    
    if (results.competitions.count === 0) {
      console.log('\n→ ACTION REQUIRED: Run data sync');
      console.log('  Command: node backend/scripts/trigger-sync.js');
      console.log('  Or visit: https://devarena-rust.vercel.app/api/admin/sync');
    }
  }
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Main execution
 */
async function main() {
  console.log('Production Database Verification');
  console.log('='.repeat(60));
  console.log(`Database URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'NOT SET'}`);
  console.log('='.repeat(60) + '\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('✗ ERROR: DATABASE_URL environment variable is not set');
    console.error('\nUsage:');
    console.error('  DATABASE_URL="your_production_url" node backend/migrations/verify-production-db.js');
    process.exit(1);
  }
  
  const results = {
    connection: false,
    tables: { allExist: false, results: [] },
    competitions: { exists: false, count: 0 },
    config: false,
    indexes: false,
  };
  
  try {
    // Run all checks
    results.connection = await checkConnection();
    
    if (results.connection) {
      results.tables = await verifyTables();
      results.competitions = await checkCompetitionsData();
      results.config = await checkDatabaseConfig();
      results.indexes = await checkIndexes();
    }
    
    // Generate summary
    generateSummary(results);
    
  } catch (error) {
    console.error('\n✗ Unexpected error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || 
    process.argv[1].endsWith('verify-production-db.js')) {
  main();
}

export { checkConnection, verifyTables, checkCompetitionsData, checkDatabaseConfig, checkIndexes };
