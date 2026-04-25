/**
 * Verification script for database module structure
 * This script verifies the module exports without requiring a database connection
 * Run with: node verify-db-module.js
 */

import db from './src/utils/db.js';

console.log('Verifying database module structure...\n');

const requiredExports = [
  'query',
  'getPool',
  'getClient',
  'testConnection',
  'closePool',
  'initializePool',
];

let allPassed = true;

// Check each required export
for (const exportName of requiredExports) {
  if (typeof db[exportName] === 'function') {
    console.log(`✓ ${exportName} is exported as a function`);
  } else {
    console.log(`✗ ${exportName} is missing or not a function`);
    allPassed = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('✓ All required exports are present');
  console.log('='.repeat(50));
  console.log('\nModule structure verification passed!');
  console.log('\nTo test database connectivity, ensure:');
  console.log('1. PostgreSQL is running');
  console.log('2. .env file exists with DATABASE_URL');
  console.log('3. Run: node test-db-connection.js');
  process.exit(0);
} else {
  console.log('✗ Some required exports are missing');
  console.log('='.repeat(50));
  process.exit(1);
}
