import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import { formatConfigToEnv, parseEnvToConfig } from '../config.js';

const baseEnvEntries = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/devarena',
  JWT_SECRET: 'this-is-a-very-long-secret-key-with-more-than-32-characters',
  PORT: '3000',
  KONTESTS_API_URL: 'https://kontests.net/api/v1/all',
  CLIST_API_URL: 'https://clist.by/api/v2/contest/',
  KAGGLE_API_KEY: 'test-kaggle-api-key',
};

const requiredKeys = Object.keys(baseEnvEntries);

function withTempEnvFile(content, callback) {
  const filePath = join(
    tmpdir(),
    `.env.property.${Date.now()}.${Math.random().toString(36).slice(2)}`
  );

  writeFileSync(filePath, content);

  try {
    return callback(filePath);
  } finally {
    unlinkSync(filePath);
  }
}

function serializeEnv(entries) {
  return Object.entries(entries)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

const envTokenArb = fc.stringOf(
  fc.constantFrom(
    ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._:/@+*'
  ),
  { minLength: 1, maxLength: 80 }
);

const safeEnvValueArb = envTokenArb;

const validConfigArb = fc.record({
  database: fc.record({
    url: fc.constant('postgresql://user:password@localhost:5432/devarena'),
    poolSize: fc.integer({ min: 1, max: 100 }),
  }),
  jwt: fc.record({
    secret: fc
      .stringOf(
        fc.constantFrom(
          ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._:/@+*'
        ),
        { minLength: 32, maxLength: 96 }
      ),
    expiresIn: safeEnvValueArb,
  }),
  server: fc.record({
    port: fc.integer({ min: 1, max: 65535 }),
    corsOrigin: fc.webUrl(),
    nodeEnv: fc.constantFrom('development', 'test', 'production', 'staging'),
  }),
  apis: fc.record({
    kontests: fc.record({
      url: fc.constant('https://kontests.net/api/v1/all'),
    }),
    clist: fc.record({
      url: fc.constant('https://clist.by/api/v2/contest/'),
      apiKey: safeEnvValueArb,
    }),
    kaggle: fc.record({
      apiKey: safeEnvValueArb,
      username: safeEnvValueArb,
    }),
  }),
  sync: fc.record({
    schedule: safeEnvValueArb,
    timeout: fc.integer({ min: 1000, max: 120000 }),
    retries: fc.integer({ min: 0, max: 10 }),
  }),
});

describe('Configuration Parser Property Tests', () => {
  test('Property 1: missing required variables produce descriptive error messages', () => {
    fc.assert(
      fc.property(fc.subarray(requiredKeys, { minLength: 1 }), (missingKeys) => {
        const envEntries = { ...baseEnvEntries };
        for (const key of missingKeys) {
          delete envEntries[key];
        }

        return withTempEnvFile(serializeEnv(envEntries), (envPath) => {
          const result = parseEnvToConfig(envPath);

          expect(result.config).toBeUndefined();
          expect(result.error).toBeDefined();
          expect(result.error.code).toBe('MISSING_REQUIRED_VARIABLES');

          for (const key of missingKeys) {
            expect(result.error.message).toContain(key);
            expect(result.error.details.missing).toContain(key);
          }
        });
      }),
      { numRuns: 100 }
    );
  });

  test('Property 2: parse -> format -> parse preserves valid configuration values', () => {
    fc.assert(
      fc.property(validConfigArb, (config) => {
        return withTempEnvFile(formatConfigToEnv(config), (envPath) => {
          const result = parseEnvToConfig(envPath);

          expect(result.error).toBeUndefined();
          expect(result.config).toEqual(config);
        });
      }),
      { numRuns: 100 }
    );
  });
});
