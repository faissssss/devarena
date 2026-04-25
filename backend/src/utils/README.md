# Database Connection Module

This module provides a PostgreSQL connection pool with automatic retry logic and error handling for the DevArena platform.

## Features

- **Connection Pooling**: Efficient connection management with configurable pool size
- **Automatic Retry Logic**: Exponential backoff for transient connection errors
- **Error Handling**: Comprehensive error handling with detailed logging
- **Environment Configuration**: Parses DATABASE_URL from environment variables
- **Transaction Support**: Get individual clients for transaction management
- **Connection Testing**: Built-in connection health check

## Usage

### Basic Query Execution

```javascript
import db from './utils/db.js';

// Simple query
const result = await db.query('SELECT * FROM users');
console.log(result.rows);

// Parameterized query
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  ['user@example.com']
);
console.log(user.rows[0]);
```

### Transaction Management

```javascript
import db from './utils/db.js';

const client = await db.getClient();

try {
  await client.query('BEGIN');
  
  await client.query(
    'INSERT INTO users (username, email) VALUES ($1, $2)',
    ['john', 'john@example.com']
  );
  
  await client.query(
    'INSERT INTO bookmarks (user_id, competition_id) VALUES ($1, $2)',
    [userId, competitionId]
  );
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Connection Testing

```javascript
import db from './utils/db.js';

// Test database connection
const isConnected = await db.testConnection();
if (isConnected) {
  console.log('Database is ready');
} else {
  console.error('Database connection failed');
}
```

### Graceful Shutdown

```javascript
import db from './utils/db.js';

// Close pool on application shutdown
process.on('SIGTERM', async () => {
  await db.closePool();
  process.exit(0);
});
```

## Configuration

The module reads configuration from environment variables:

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/devarena

# Optional (with defaults)
SYNC_RETRIES=3  # Number of retry attempts for failed connections
```

### Connection Pool Settings

The module uses the following pool configuration:

- **max**: 20 connections (maximum pool size)
- **idleTimeoutMillis**: 30000ms (close idle clients after 30 seconds)
- **connectionTimeoutMillis**: 10000ms (connection timeout)

## Error Handling

### Retryable Errors

The module automatically retries on the following errors:

- `ECONNREFUSED` - Connection refused
- `ETIMEDOUT` - Connection timeout
- `ENOTFOUND` - DNS lookup failed
- `ECONNRESET` - Connection reset
- `EPIPE` - Broken pipe
- `EAI_AGAIN` - DNS lookup timeout
- Connection terminated/lost messages

### Retry Strategy

- **Initial delay**: 1 second
- **Backoff**: Exponential (1s, 2s, 4s, 8s, ...)
- **Max retries**: 3 (configurable via SYNC_RETRIES)

### Non-Retryable Errors

The following errors are not retried:

- SQL syntax errors
- Constraint violations
- Permission errors
- Invalid queries

## API Reference

### `initializePool()`

Initializes the PostgreSQL connection pool.

**Returns**: `Pool` - PostgreSQL connection pool instance

**Throws**: Error if DATABASE_URL is not defined

### `getPool()`

Gets the current connection pool, initializing it if necessary.

**Returns**: `Pool` - PostgreSQL connection pool instance

### `query(text, params, retryCount)`

Executes a SQL query with automatic retry logic.

**Parameters**:
- `text` (string): SQL query text
- `params` (Array): Query parameters (optional, default: [])
- `retryCount` (number): Internal retry counter (optional)

**Returns**: `Promise<Object>` - Query result with `rows` and `rowCount`

**Example**:
```javascript
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### `getClient()`

Gets a client from the pool for transaction support.

**Returns**: `Promise<PoolClient>` - Database client

**Important**: Always call `client.release()` when done!

**Example**:
```javascript
const client = await db.getClient();
try {
  // Use client
} finally {
  client.release();
}
```

### `testConnection()`

Tests the database connection.

**Returns**: `Promise<boolean>` - True if connection successful

### `closePool()`

Closes the database connection pool.

**Returns**: `Promise<void>`

## Logging

The module logs the following events:

- **Connection events**: Client connected/removed from pool
- **Slow queries**: Queries taking > 1 second
- **Errors**: Query errors with context
- **Retries**: Retry attempts with delay information

## Testing

### Manual Testing

Run the manual test script:

```bash
node test-db-connection.js
```

### Unit Tests

Run unit tests with mocked pg module:

```bash
npm test -- src/utils/__tests__/db.test.js
```

### Integration Tests

Run integration tests with real database:

```bash
npm test -- src/utils/__tests__/db.integration.test.js
```

**Note**: Integration tests require a running PostgreSQL database with DATABASE_URL configured.

## Best Practices

1. **Always use parameterized queries** to prevent SQL injection:
   ```javascript
   // Good
   await db.query('SELECT * FROM users WHERE id = $1', [userId]);
   
   // Bad
   await db.query(`SELECT * FROM users WHERE id = ${userId}`);
   ```

2. **Release clients after use**:
   ```javascript
   const client = await db.getClient();
   try {
     // Use client
   } finally {
     client.release(); // Always release!
   }
   ```

3. **Handle errors appropriately**:
   ```javascript
   try {
     await db.query('...');
   } catch (error) {
     console.error('Database error:', error.message);
     // Handle error appropriately
   }
   ```

4. **Use transactions for multi-step operations**:
   ```javascript
   const client = await db.getClient();
   try {
     await client.query('BEGIN');
     // Multiple queries
     await client.query('COMMIT');
   } catch (error) {
     await client.query('ROLLBACK');
     throw error;
   } finally {
     client.release();
   }
   ```

## Troubleshooting

### "DATABASE_URL environment variable is required"

Ensure your `.env` file contains a valid DATABASE_URL:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
```

### Connection Refused Errors

1. Check if PostgreSQL is running
2. Verify the host and port in DATABASE_URL
3. Check firewall settings

### Connection Timeout

1. Increase `connectionTimeoutMillis` if needed
2. Check network connectivity
3. Verify PostgreSQL is accepting connections

### Pool Exhausted

1. Ensure clients are being released after use
2. Increase pool size if needed
3. Check for connection leaks in your code

## Requirements

This module implements **Requirement 11.7** from the DevArena platform specification:

- ✓ PostgreSQL connection pool using pg library
- ✓ Parse DATABASE_URL from environment variables
- ✓ Connection error handling with retry logic
- ✓ Exponential backoff for retries
- ✓ Comprehensive error logging
