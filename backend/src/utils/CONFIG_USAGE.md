# Configuration Parser Usage Guide

## Overview

The configuration parser module (`config.js`) provides functions to load and validate environment variables from a `.env` file. It ensures all required variables are present and properly formatted before the application starts.

## Required Environment Variables

The following environment variables are **required** and must be present in your `.env` file:

- `DATABASE_URL` - PostgreSQL connection string (must be a valid URL)
- `JWT_SECRET` - Secret key for JWT token signing (minimum 32 characters)
- `PORT` - Server port number (1-65535)
- `KONTESTS_API_URL` - Kontests.net API endpoint (must be a valid URL)
- `CLIST_API_URL` - CLIST.by API endpoint (must be a valid URL)
- `KAGGLE_API_KEY` - Kaggle API key

## Optional Environment Variables

The following variables are optional and will use default values if not provided:

- `CLIST_API_KEY` - CLIST.by API key (default: empty string)
- `KAGGLE_USERNAME` - Kaggle username (default: empty string)
- `CORS_ORIGIN` - CORS origin for frontend (default: 'http://localhost:5173')
- `JWT_EXPIRES_IN` - JWT token expiration (default: '7d')
- `DB_POOL_SIZE` - Database connection pool size (default: 10)
- `SYNC_SCHEDULE` - Cron schedule for data sync (default: '0 */6 * * *')
- `SYNC_TIMEOUT` - API request timeout in ms (default: 30000)
- `SYNC_RETRIES` - Number of retry attempts (default: 3)
- `NODE_ENV` - Node environment (default: 'development')

## Usage

### Basic Usage (Application Startup)

Use `loadConfig()` to load and validate configuration at application startup. This function throws an error if validation fails:

```javascript
import { loadConfig } from './utils/config.js';

try {
  const config = loadConfig();
  
  // Use configuration
  console.log(`Starting server on port ${config.server.port}`);
  console.log(`Database: ${config.database.url}`);
  
  // Access nested configuration
  const jwtSecret = config.jwt.secret;
  const apiUrl = config.apis.kontests.url;
  
} catch (error) {
  console.error('Failed to load configuration:', error.message);
  process.exit(1);
}
```

### Advanced Usage (Custom Error Handling)

Use `parseEnvToConfig()` for more control over error handling:

```javascript
import { parseEnvToConfig } from './utils/config.js';

const result = parseEnvToConfig();

if (result.error) {
  console.error('Configuration Error:', result.error.code);
  console.error('Message:', result.error.message);
  
  if (result.error.details) {
    console.error('Missing variables:', result.error.details.missing);
    console.error('Empty variables:', result.error.details.empty);
  }
  
  process.exit(1);
}

const config = result.config;
// Use config...
```

### Custom .env File Path

You can specify a custom path to the `.env` file:

```javascript
import { loadConfig } from './utils/config.js';

// Load from custom path
const config = loadConfig('/path/to/custom/.env');
```

## Configuration Object Structure

The parsed configuration object has the following structure:

```javascript
{
  database: {
    url: string,           // PostgreSQL connection URL
    poolSize: number       // Connection pool size
  },
  jwt: {
    secret: string,        // JWT signing secret
    expiresIn: string      // Token expiration (e.g., '7d')
  },
  server: {
    port: number,          // Server port
    corsOrigin: string,    // CORS origin
    nodeEnv: string        // Node environment
  },
  apis: {
    kontests: {
      url: string          // Kontests.net API URL
    },
    clist: {
      url: string,         // CLIST.by API URL
      apiKey: string       // CLIST.by API key
    },
    kaggle: {
      apiKey: string,      // Kaggle API key
      username: string     // Kaggle username
    }
  },
  sync: {
    schedule: string,      // Cron schedule
    timeout: number,       // Request timeout (ms)
    retries: number        // Retry attempts
  }
}
```

## Error Codes

The parser returns the following error codes:

- `ENV_FILE_NOT_FOUND` - The .env file does not exist at the specified path
- `ENV_PARSE_ERROR` - Failed to parse the .env file (syntax error)
- `MISSING_REQUIRED_VARIABLES` - One or more required variables are missing or empty
- `INVALID_PORT` - PORT is not a valid number between 1 and 65535
- `WEAK_JWT_SECRET` - JWT_SECRET is shorter than 32 characters
- `INVALID_URL` - One of the URL variables is not a valid URL

## Validation Rules

### PORT Validation
- Must be a valid integer
- Must be between 1 and 65535 (inclusive)

### JWT_SECRET Validation
- Must be at least 32 characters long (security requirement)

### URL Validation
- `DATABASE_URL`, `KONTESTS_API_URL`, and `CLIST_API_URL` must be valid URLs
- URLs are validated using the built-in `URL` constructor

### Required Variables
- All required variables must be present in the .env file
- Required variables cannot be empty (whitespace-only values are considered empty)

## Example .env File

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/devarena

# JWT Configuration
JWT_SECRET=your-secret-key-here-minimum-32-characters-long

# Server Configuration
PORT=3000
CORS_ORIGIN=http://localhost:5173

# External API Configuration - Kontests.net
KONTESTS_API_URL=https://kontests.net/api/v1/all

# External API Configuration - CLIST.by
CLIST_API_URL=https://clist.by/api/v2/contest/
CLIST_API_KEY=your-clist-api-key

# External API Configuration - Kaggle
KAGGLE_API_KEY=your-kaggle-api-key
KAGGLE_USERNAME=your-kaggle-username

# Data Sync Configuration
SYNC_SCHEDULE=0 */6 * * *
SYNC_TIMEOUT=30000
SYNC_RETRIES=3

# Node Environment
NODE_ENV=development
```

## Testing

The configuration parser includes comprehensive unit tests covering:
- Valid configuration parsing
- Missing required variables
- Empty variables
- Invalid PORT values
- Weak JWT_SECRET
- Invalid URLs
- Missing .env file
- Default value handling

Run tests with:
```bash
npm test config.test.js
```

## Requirements Validation

This module validates the following requirements:
- **Requirement 11.1**: Parse .env configuration file
- **Requirement 11.2**: Load environment variables into application context
- **Requirement 11.3**: Return descriptive error for invalid/missing .env file
- **Requirement 11.4**: Validate required environment variables (DATABASE_URL, JWT_SECRET, PORT, API URLs, API keys)
