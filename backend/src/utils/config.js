/**
 * Configuration Parser Module
 * 
 * Parses and validates environment variables for the DevArena platform.
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

/**
 * Required environment variables for the application
 */
const REQUIRED_VARIABLES = [
  'DATABASE_URL',
  'JWT_SECRET',
  'PORT',
  'KONTESTS_API_URL',
  'CLIST_API_URL',
  'KAGGLE_API_KEY'
];

/**
 * Parses environment variables from .env file and validates required variables
 * 
 * @param {string} envPath - Optional path to .env file (defaults to project root)
 * @returns {Object} Configuration object or error object
 * @returns {Object} result.config - Parsed configuration (if successful)
 * @returns {Object} result.error - Error details (if validation fails)
 */
export function parseEnvToConfig(envPath = null) {
  // Load .env file if path is provided or use default location
  if (envPath === null) {
    // Default to .env in project root (two levels up from this file)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    envPath = join(__dirname, '../../../.env');
  }

  // Check if .env file exists
  if (!existsSync(envPath)) {
    return {
      error: {
        code: 'ENV_FILE_NOT_FOUND',
        message: `Environment file not found at path: ${envPath}. Please create a .env file based on .env.example`
      }
    };
  }

  let parsedEnv;
  try {
    parsedEnv = dotenv.parse(readFileSync(envPath));
  } catch (error) {
    return {
      error: {
        code: 'ENV_PARSE_ERROR',
        message: `Failed to parse environment file: ${error.message}`
      }
    };
  }

  // Validate required environment variables
  const missingVariables = [];
  const emptyVariables = [];

  for (const varName of REQUIRED_VARIABLES) {
    const value = parsedEnv[varName];
    
    if (value === undefined) {
      missingVariables.push(varName);
    } else if (value.trim() === '') {
      emptyVariables.push(varName);
    }
  }

  // Build descriptive error message for missing or empty variables
  if (missingVariables.length > 0 || emptyVariables.length > 0) {
    const errorParts = [];
    
    if (missingVariables.length > 0) {
      errorParts.push(`Missing required environment variables: ${missingVariables.join(', ')}`);
    }
    
    if (emptyVariables.length > 0) {
      errorParts.push(`Empty required environment variables: ${emptyVariables.join(', ')}`);
    }

    return {
      error: {
        code: 'MISSING_REQUIRED_VARIABLES',
        message: errorParts.join('. '),
        details: {
          missing: missingVariables,
          empty: emptyVariables
        }
      }
    };
  }

  // Validate PORT is a valid number
  const port = parseInt(parsedEnv.PORT, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    return {
      error: {
        code: 'INVALID_PORT',
        message: `PORT must be a valid number between 1 and 65535, got: ${parsedEnv.PORT}`
      }
    };
  }

  // Validate JWT_SECRET has minimum length (security requirement)
  if (parsedEnv.JWT_SECRET.length < 32) {
    return {
      error: {
        code: 'WEAK_JWT_SECRET',
        message: `JWT_SECRET must be at least 32 characters long for security, got ${parsedEnv.JWT_SECRET.length} characters`
      }
    };
  }

  // Validate URLs have proper format
  const urlVariables = ['DATABASE_URL', 'KONTESTS_API_URL', 'CLIST_API_URL'];
  for (const varName of urlVariables) {
    const value = parsedEnv[varName];
    try {
      new URL(value);
    } catch (error) {
      return {
        error: {
          code: 'INVALID_URL',
          message: `${varName} must be a valid URL, got: ${value}`
        }
      };
    }
  }

  // Build and return configuration object
  const config = {
    database: {
      url: parsedEnv.DATABASE_URL,
      poolSize: parseInt(parsedEnv.DB_POOL_SIZE || '10', 10)
    },
    jwt: {
      secret: parsedEnv.JWT_SECRET,
      expiresIn: parsedEnv.JWT_EXPIRES_IN || '7d'
    },
    server: {
      port: port,
      corsOrigin: parsedEnv.CORS_ORIGIN || 'http://localhost:5173',
      nodeEnv: parsedEnv.NODE_ENV || 'development'
    },
    apis: {
      kontests: {
        url: parsedEnv.KONTESTS_API_URL
      },
      clist: {
        url: parsedEnv.CLIST_API_URL,
        apiKey: parsedEnv.CLIST_API_KEY || ''
      },
      kaggle: {
        apiKey: parsedEnv.KAGGLE_API_KEY,
        username: parsedEnv.KAGGLE_USERNAME || ''
      }
    },
    sync: {
      schedule: parsedEnv.SYNC_SCHEDULE || '0 */6 * * *',
      timeout: parseInt(parsedEnv.SYNC_TIMEOUT || '30000', 10),
      retries: parseInt(parsedEnv.SYNC_RETRIES || '3', 10)
    }
  };

  return { config };
}

/**
 * Formats a configuration object to .env file format
 * 
 * @param {Object} config - Configuration object (as returned by parseEnvToConfig)
 * @returns {string} .env file content
 */
export function formatConfigToEnv(config) {
  const lines = [];
  
  // Required variables
  lines.push(`DATABASE_URL=${config.database.url}`);
  lines.push(`JWT_SECRET=${config.jwt.secret}`);
  lines.push(`PORT=${config.server.port}`);
  lines.push(`KONTESTS_API_URL=${config.apis.kontests.url}`);
  lines.push(`CLIST_API_URL=${config.apis.clist.url}`);
  lines.push(`KAGGLE_API_KEY=${config.apis.kaggle.apiKey}`);
  
  // Optional variables with defaults
  if (config.database.poolSize !== 10) {
    lines.push(`DB_POOL_SIZE=${config.database.poolSize}`);
  }
  
  if (config.jwt.expiresIn !== '7d') {
    lines.push(`JWT_EXPIRES_IN=${config.jwt.expiresIn}`);
  }
  
  if (config.server.corsOrigin !== 'http://localhost:5173') {
    lines.push(`CORS_ORIGIN=${config.server.corsOrigin}`);
  }
  
  if (config.server.nodeEnv !== 'development') {
    lines.push(`NODE_ENV=${config.server.nodeEnv}`);
  }
  
  if (config.apis.clist.apiKey !== '') {
    lines.push(`CLIST_API_KEY=${config.apis.clist.apiKey}`);
  }
  
  if (config.apis.kaggle.username !== '') {
    lines.push(`KAGGLE_USERNAME=${config.apis.kaggle.username}`);
  }
  
  if (config.sync.schedule !== '0 */6 * * *') {
    lines.push(`SYNC_SCHEDULE=${config.sync.schedule}`);
  }
  
  if (config.sync.timeout !== 30000) {
    lines.push(`SYNC_TIMEOUT=${config.sync.timeout}`);
  }
  
  if (config.sync.retries !== 3) {
    lines.push(`SYNC_RETRIES=${config.sync.retries}`);
  }
  
  return lines.join('\n');
}

/**
 * Loads and validates configuration, throwing an error if validation fails
 * This is a convenience function for application startup
 * 
 * @param {string} envPath - Optional path to .env file
 * @returns {Object} Configuration object
 * @throws {Error} If configuration validation fails
 */
export function loadConfig(envPath = null) {
  const result = parseEnvToConfig(envPath);
  
  if (result.error) {
    throw new Error(`Configuration Error: ${result.error.message}`);
  }
  
  return result.config;
}
