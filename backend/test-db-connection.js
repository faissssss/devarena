/**
 * Manual test script for database connection
 * Run with: node test-db-connection.js
 */

import db from './src/utils/db.js';

async function testDatabaseConnection() {
  console.log('Testing database connection...\n');

  try {
    // Test 1: Initialize pool
    console.log('1. Initializing connection pool...');
    db.initializePool();
    console.log('✓ Pool initialized successfully\n');

    // Test 2: Test connection
    console.log('2. Testing database connection...');
    const connectionResult = await db.testConnection();
    if (connectionResult) {
      console.log('✓ Database connection successful\n');
    } else {
      console.log('✗ Database connection failed\n');
      process.exit(1);
    }

    // Test 3: Execute simple query
    console.log('3. Executing simple query...');
    const simpleResult = await db.query('SELECT 1 as number, NOW() as timestamp');
    console.log('✓ Query executed successfully');
    console.log('  Result:', simpleResult.rows[0]);
    console.log('');

    // Test 4: Execute parameterized query
    console.log('4. Executing parameterized query...');
    const paramResult = await db.query(
      'SELECT $1::text as message, $2::int as count',
      ['Hello from DevArena', 42]
    );
    console.log('✓ Parameterized query executed successfully');
    console.log('  Result:', paramResult.rows[0]);
    console.log('');

    // Test 5: Get client from pool
    console.log('5. Getting client from pool...');
    const client = await db.getClient();
    console.log('✓ Client acquired from pool');

    // Test 6: Execute query with client
    console.log('6. Executing query with client...');
    const clientResult = await client.query('SELECT version()');
    console.log('✓ Client query executed successfully');
    console.log('  PostgreSQL version:', clientResult.rows[0].version.substring(0, 50) + '...');
    console.log('');

    // Release client
    client.release();
    console.log('✓ Client released back to pool\n');

    // Test 7: Test transaction
    console.log('7. Testing transaction...');
    const txClient = await db.getClient();
    try {
      await txClient.query('BEGIN');
      await txClient.query('SELECT 1');
      await txClient.query('COMMIT');
      console.log('✓ Transaction completed successfully\n');
    } catch (error) {
      await txClient.query('ROLLBACK');
      throw error;
    } finally {
      txClient.release();
    }

    // Test 8: Close pool
    console.log('8. Closing connection pool...');
    await db.closePool();
    console.log('✓ Pool closed successfully\n');

    console.log('='.repeat(50));
    console.log('All tests passed! ✓');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Test failed with error:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run tests
testDatabaseConnection();
