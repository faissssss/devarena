/**
 * Unit Tests for Configuration Parser
 * 
 * Tests the parseEnvToConfig function for various scenarios:
 * - Valid configuration
 * - Missing required variables
 * - Empty variables
 * - Invalid PORT values
 * - Weak JWT_SECRET
 * - Invalid URLs
 * - Missing .env file
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { parseEnvToConfig, loadConfig, formatConfigToEnv } from '../config.js';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Configuration Parser', () => {
  let testEnvPath;
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Create a temporary .env file path
    testEnvPath = join(tmpdir(), `.env.test.${Date.now()}`);
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Clean up test .env file
    if (existsSync(testEnvPath)) {
      unlinkSync(testEnvPath);
    }
  });

  describe('Valid Configuration', () => {
    test('should parse valid configuration successfully', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters
PORT=3000
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
CLIST_API_KEY=test-clist-api-key
KAGGLE_USERNAME=testuser
CORS_ORIGIN=http://localhost:5173
SYNC_SCHEDULE=0 */6 * * *
SYNC_TIMEOUT=30000
SYNC_RETRIES=3
NODE_ENV=development
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.error).toBeUndefined();
      expect(result.config).toBeDefined();
      expect(result.config.database.url).toBe('postgresql://user:password@localhost:5432/devarena');
      expect(result.config.jwt.secret).toBe('this-is-a-very-long-secret-key-with-more-than-32-characters');
      expect(result.config.server.port).toBe(3000);
      expect(result.config.apis.kontests.url).toBe('https://kontests.net/api/v1/all');
      expect(result.config.apis.clist.url).toBe('https://clist.by/api/v2/contest/');
      expect(result.config.apis.clist.apiKey).toBe('test-clist-api-key');
      expect(result.config.apis.kaggle.apiKey).toBe('test-kaggle-api-key');
      expect(result.config.apis.kaggle.username).toBe('testuser');
      expect(result.config.server.corsOrigin).toBe('http://localhost:5173');
      expect(result.config.sync.schedule).toBe('0 */6 * * *');
      expect(result.config.sync.timeout).toBe(30000);
      expect(result.config.sync.retries).toBe(3);
    });

    test('should use default values for optional variables', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters
PORT=3000
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.error).toBeUndefined();
      expect(result.config).toBeDefined();
      expect(result.config.server.corsOrigin).toBe('http://localhost:5173');
      expect(result.config.sync.schedule).toBe('0 */6 * * *');
      expect(result.config.sync.timeout).toBe(30000);
      expect(result.config.sync.retries).toBe(3);
      expect(result.config.jwt.expiresIn).toBe('7d');
      expect(result.config.database.poolSize).toBe(10);
    });
  });

  describe('Missing Required Variables', () => {
    test('should return error for missing DATABASE_URL', () => {
      const envContent = `
JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters
PORT=3000
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('MISSING_REQUIRED_VARIABLES');
      expect(result.error.message).toContain('DATABASE_URL');
      expect(result.error.details.missing).toContain('DATABASE_URL');
    });

    test('should return error for missing JWT_SECRET', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
PORT=3000
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('MISSING_REQUIRED_VARIABLES');
      expect(result.error.message).toContain('JWT_SECRET');
      expect(result.error.details.missing).toContain('JWT_SECRET');
    });

    test('should return error for missing PORT', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('MISSING_REQUIRED_VARIABLES');
      expect(result.error.message).toContain('PORT');
      expect(result.error.details.missing).toContain('PORT');
    });

    test('should return error for missing KONTESTS_API_URL', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters
PORT=3000
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('MISSING_REQUIRED_VARIABLES');
      expect(result.error.message).toContain('KONTESTS_API_URL');
      expect(result.error.details.missing).toContain('KONTESTS_API_URL');
    });

    test('should return error for missing CLIST_API_URL', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters
PORT=3000
KONTESTS_API_URL=https://kontests.net/api/v1/all
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('MISSING_REQUIRED_VARIABLES');
      expect(result.error.message).toContain('CLIST_API_URL');
      expect(result.error.details.missing).toContain('CLIST_API_URL');
    });

    test('should return error for missing KAGGLE_API_KEY', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters
PORT=3000
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('MISSING_REQUIRED_VARIABLES');
      expect(result.error.message).toContain('KAGGLE_API_KEY');
      expect(result.error.details.missing).toContain('KAGGLE_API_KEY');
    });

    test('should return error for multiple missing variables', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
PORT=3000
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('MISSING_REQUIRED_VARIABLES');
      expect(result.error.message).toContain('JWT_SECRET');
      expect(result.error.message).toContain('KONTESTS_API_URL');
      expect(result.error.message).toContain('CLIST_API_URL');
      expect(result.error.message).toContain('KAGGLE_API_KEY');
      expect(result.error.details.missing).toHaveLength(4);
    });
  });

  describe('Empty Variables', () => {
    test('should return error for empty DATABASE_URL', () => {
      const envContent = `
DATABASE_URL=
JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters
PORT=3000
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('MISSING_REQUIRED_VARIABLES');
      expect(result.error.message).toContain('Empty required environment variables');
      expect(result.error.message).toContain('DATABASE_URL');
      expect(result.error.details.empty).toContain('DATABASE_URL');
    });

    test('should return error for empty JWT_SECRET', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=
PORT=3000
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('MISSING_REQUIRED_VARIABLES');
      expect(result.error.message).toContain('Empty required environment variables');
      expect(result.error.message).toContain('JWT_SECRET');
      expect(result.error.details.empty).toContain('JWT_SECRET');
    });
  });

  describe('Invalid PORT Values', () => {
    test('should return error for non-numeric PORT', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters
PORT=not-a-number
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_PORT');
      expect(result.error.message).toContain('PORT must be a valid number');
      expect(result.error.message).toContain('not-a-number');
    });

    test('should return error for PORT below valid range', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters
PORT=0
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_PORT');
      expect(result.error.message).toContain('PORT must be a valid number between 1 and 65535');
    });

    test('should return error for PORT above valid range', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters
PORT=70000
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_PORT');
      expect(result.error.message).toContain('PORT must be a valid number between 1 and 65535');
    });
  });

  describe('JWT_SECRET Validation', () => {
    test('should return error for JWT_SECRET shorter than 32 characters', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=short-secret
PORT=3000
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('WEAK_JWT_SECRET');
      expect(result.error.message).toContain('JWT_SECRET must be at least 32 characters long');
      expect(result.error.message).toContain('12 characters');
    });

    test('should accept JWT_SECRET with exactly 32 characters', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=12345678901234567890123456789012
PORT=3000
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.error).toBeUndefined();
      expect(result.config).toBeDefined();
      expect(result.config.jwt.secret).toBe('12345678901234567890123456789012');
    });
  });

  describe('URL Validation', () => {
    test('should return error for invalid DATABASE_URL', () => {
      const envContent = `
DATABASE_URL=not-a-valid-url
JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters
PORT=3000
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_URL');
      expect(result.error.message).toContain('DATABASE_URL must be a valid URL');
      expect(result.error.message).toContain('not-a-valid-url');
    });

    test('should return error for invalid KONTESTS_API_URL', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters
PORT=3000
KONTESTS_API_URL=invalid-url
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_URL');
      expect(result.error.message).toContain('KONTESTS_API_URL must be a valid URL');
    });

    test('should return error for invalid CLIST_API_URL', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters
PORT=3000
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=invalid-url
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result = parseEnvToConfig(testEnvPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('INVALID_URL');
      expect(result.error.message).toContain('CLIST_API_URL must be a valid URL');
    });
  });

  describe('Missing .env File', () => {
    test('should return error when .env file does not exist', () => {
      const nonExistentPath = join(tmpdir(), `.env.nonexistent.${Date.now()}`);
      const result = parseEnvToConfig(nonExistentPath);

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('ENV_FILE_NOT_FOUND');
      expect(result.error.message).toContain('Environment file not found');
      expect(result.error.message).toContain(nonExistentPath);
    });
  });

  describe('loadConfig Function', () => {
    test('should return config object for valid configuration', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters
PORT=3000
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const config = loadConfig(testEnvPath);

      expect(config).toBeDefined();
      expect(config.database.url).toBe('postgresql://user:password@localhost:5432/devarena');
      expect(config.server.port).toBe(3000);
    });

    test('should throw error for invalid configuration', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
PORT=3000
      `.trim();

      writeFileSync(testEnvPath, envContent);

      expect(() => loadConfig(testEnvPath)).toThrow('Configuration Error');
      expect(() => loadConfig(testEnvPath)).toThrow('JWT_SECRET');
    });
  });

  describe('formatConfigToEnv Function', () => {
    test('should format config object to .env format with required variables', () => {
      const config = {
        database: {
          url: 'postgresql://user:password@localhost:5432/devarena',
          poolSize: 10
        },
        jwt: {
          secret: 'this-is-a-very-long-secret-key-with-more-than-32-characters',
          expiresIn: '7d'
        },
        server: {
          port: 3000,
          corsOrigin: 'http://localhost:5173',
          nodeEnv: 'development'
        },
        apis: {
          kontests: {
            url: 'https://kontests.net/api/v1/all'
          },
          clist: {
            url: 'https://clist.by/api/v2/contest/',
            apiKey: ''
          },
          kaggle: {
            apiKey: 'test-kaggle-api-key',
            username: ''
          }
        },
        sync: {
          schedule: '0 */6 * * *',
          timeout: 30000,
          retries: 3
        }
      };

      const envString = formatConfigToEnv(config);

      expect(envString).toContain('DATABASE_URL=postgresql://user:password@localhost:5432/devarena');
      expect(envString).toContain('JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters');
      expect(envString).toContain('PORT=3000');
      expect(envString).toContain('KONTESTS_API_URL=https://kontests.net/api/v1/all');
      expect(envString).toContain('CLIST_API_URL=https://clist.by/api/v2/contest/');
      expect(envString).toContain('KAGGLE_API_KEY=test-kaggle-api-key');
    });

    test('should include optional variables when they differ from defaults', () => {
      const config = {
        database: {
          url: 'postgresql://user:password@localhost:5432/devarena',
          poolSize: 20
        },
        jwt: {
          secret: 'this-is-a-very-long-secret-key-with-more-than-32-characters',
          expiresIn: '14d'
        },
        server: {
          port: 3000,
          corsOrigin: 'http://localhost:3000',
          nodeEnv: 'production'
        },
        apis: {
          kontests: {
            url: 'https://kontests.net/api/v1/all'
          },
          clist: {
            url: 'https://clist.by/api/v2/contest/',
            apiKey: 'test-clist-api-key'
          },
          kaggle: {
            apiKey: 'test-kaggle-api-key',
            username: 'testuser'
          }
        },
        sync: {
          schedule: '0 */12 * * *',
          timeout: 60000,
          retries: 5
        }
      };

      const envString = formatConfigToEnv(config);

      expect(envString).toContain('DB_POOL_SIZE=20');
      expect(envString).toContain('JWT_EXPIRES_IN=14d');
      expect(envString).toContain('CORS_ORIGIN=http://localhost:3000');
      expect(envString).toContain('NODE_ENV=production');
      expect(envString).toContain('CLIST_API_KEY=test-clist-api-key');
      expect(envString).toContain('KAGGLE_USERNAME=testuser');
      expect(envString).toContain('SYNC_SCHEDULE=0 */12 * * *');
      expect(envString).toContain('SYNC_TIMEOUT=60000');
      expect(envString).toContain('SYNC_RETRIES=5');
    });

    test('should omit optional variables when they match defaults', () => {
      const config = {
        database: {
          url: 'postgresql://user:password@localhost:5432/devarena',
          poolSize: 10
        },
        jwt: {
          secret: 'this-is-a-very-long-secret-key-with-more-than-32-characters',
          expiresIn: '7d'
        },
        server: {
          port: 3000,
          corsOrigin: 'http://localhost:5173',
          nodeEnv: 'development'
        },
        apis: {
          kontests: {
            url: 'https://kontests.net/api/v1/all'
          },
          clist: {
            url: 'https://clist.by/api/v2/contest/',
            apiKey: ''
          },
          kaggle: {
            apiKey: 'test-kaggle-api-key',
            username: ''
          }
        },
        sync: {
          schedule: '0 */6 * * *',
          timeout: 30000,
          retries: 3
        }
      };

      const envString = formatConfigToEnv(config);

      expect(envString).not.toContain('DB_POOL_SIZE');
      expect(envString).not.toContain('JWT_EXPIRES_IN');
      expect(envString).not.toContain('CORS_ORIGIN');
      expect(envString).not.toContain('NODE_ENV');
      expect(envString).not.toContain('CLIST_API_KEY');
      expect(envString).not.toContain('KAGGLE_USERNAME');
      expect(envString).not.toContain('SYNC_SCHEDULE');
      expect(envString).not.toContain('SYNC_TIMEOUT');
      expect(envString).not.toContain('SYNC_RETRIES');
    });

    test('should support round-trip conversion (parse -> format -> parse)', () => {
      const envContent = `
DATABASE_URL=postgresql://user:password@localhost:5432/devarena
JWT_SECRET=this-is-a-very-long-secret-key-with-more-than-32-characters
PORT=3000
KONTESTS_API_URL=https://kontests.net/api/v1/all
CLIST_API_URL=https://clist.by/api/v2/contest/
KAGGLE_API_KEY=test-kaggle-api-key
CLIST_API_KEY=test-clist-api-key
KAGGLE_USERNAME=testuser
CORS_ORIGIN=http://localhost:5173
SYNC_SCHEDULE=0 */6 * * *
SYNC_TIMEOUT=30000
SYNC_RETRIES=3
NODE_ENV=development
DB_POOL_SIZE=10
JWT_EXPIRES_IN=7d
      `.trim();

      writeFileSync(testEnvPath, envContent);
      const result1 = parseEnvToConfig(testEnvPath);
      expect(result1.error).toBeUndefined();
      
      const envString = formatConfigToEnv(result1.config);
      
      // Write formatted string to a new file
      const testEnvPath2 = join(tmpdir(), `.env.test2.${Date.now()}`);
      writeFileSync(testEnvPath2, envString);
      
      const result2 = parseEnvToConfig(testEnvPath2);
      expect(result2.error).toBeUndefined();
      
      // Compare the two config objects
      expect(result2.config).toEqual(result1.config);
      
      // Clean up
      unlinkSync(testEnvPath2);
    });
  });
});
