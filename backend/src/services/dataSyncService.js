import axios from 'axios';

import {
  parseCLISTResponse,
  parseKaggleResponse,
  parseKontestsResponse,
} from '../parsers/apiResponseParser.js';
import { upsertCompetitions } from './competitionService.js';
import { query } from '../utils/db.js';

function getTimeout() {
  return Number(process.env.SYNC_TIMEOUT || 30000);
}

function buildClistRequestConfig() {
  const config = {
    timeout: getTimeout(),
    params: {},
  };

  // Add authentication
  if (process.env.CLIST_USERNAME && process.env.CLIST_API_KEY) {
    config.params.username = process.env.CLIST_USERNAME;
    config.params.api_key = process.env.CLIST_API_KEY;
  }

  // Filter for competitions (last 365 days to next 365 days)
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  
  config.params.start__gte = oneYearAgo.toISOString();
  config.params.start__lte = oneYearFromNow.toISOString();
  config.params.order_by = 'start';
  config.params.limit = 500; // Get more contests
  config.params.with_problems = 'false'; // Don't include problems to reduce response size
  // DO NOT use format_time=true - it returns dates in DD.MM format which our parser misinterprets

  return config;
}

// Kaggle API configuration (currently unused, kept for future implementation)
// function buildKaggleRequestConfig() {
//   const config = {
//     timeout: getTimeout(),
//   };
//
//   if (process.env.KAGGLE_USERNAME && process.env.KAGGLE_API_KEY) {
//     config.auth = {
//       username: process.env.KAGGLE_USERNAME,
//       password: process.env.KAGGLE_API_KEY,
//     };
//   }
//
//   return config;
// }

export async function createSyncLog({
  source,
  status,
  recordCount = 0,
  errorMessage = null,
}) {
  const result = await query(
    `INSERT INTO sync_logs (source, status, record_count, error_message)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [source, status, recordCount, errorMessage]
  );

  return result.rows[0];
}

async function runSync({ source, request, parser }) {
  try {
    const response = await request();
    const parsed = parser(response.data);

    if (parsed.error) {
      await createSyncLog({
        source,
        status: 'error',
        errorMessage: parsed.error.message,
      });
      return { source, success: false, error: parsed.error.message, processed: 0 };
    }

    const upsertResult = await upsertCompetitions(parsed.competitions);
    await createSyncLog({
      source,
      status: 'success',
      recordCount: upsertResult.total,
    });

    return { source, success: true, processed: upsertResult.total, ...upsertResult };
  } catch (error) {
    await createSyncLog({
      source,
      status: 'error',
      errorMessage: error.message,
    });
    return { source, success: false, error: error.message, processed: 0 };
  }
}

export async function syncKontests() {
  return runSync({
    source: 'kontests',
    request: () => axios.get(process.env.KONTESTS_API_URL, { timeout: getTimeout() }),
    parser: parseKontestsResponse,
  });
}

export async function syncCLIST() {
  return runSync({
    source: 'clist',
    request: () => axios.get(process.env.CLIST_API_URL, buildClistRequestConfig()),
    parser: parseCLISTResponse,
  });
}

export async function syncKaggle() {
  try {
    // Check for serverless environment without HTTP API configuration
    if (process.env.VERCEL && !process.env.KAGGLE_API_URL) {
      const errorMessage = 'Kaggle sync not available in serverless (HTTP API not configured)';
      await createSyncLog({
        source: 'kaggle',
        status: 'error',
        errorMessage,
      });
      return { source: 'kaggle', success: false, error: errorMessage, processed: 0 };
    }

    // Use HTTP API if configured
    if (process.env.KAGGLE_API_URL) {
      return runSync({
        source: 'kaggle',
        request: () => axios.get(process.env.KAGGLE_API_URL, {
          timeout: getTimeout(),
          auth: process.env.KAGGLE_USERNAME && process.env.KAGGLE_API_KEY ? {
            username: process.env.KAGGLE_USERNAME,
            password: process.env.KAGGLE_API_KEY,
          } : undefined,
        }),
        parser: parseKaggleResponse,
      });
    }

    // Fallback to CLI for local development (non-Vercel environments)
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    // Set environment variables for Kaggle CLI
    const env = {
      ...process.env,
      KAGGLE_USERNAME: process.env.KAGGLE_USERNAME,
      KAGGLE_KEY: process.env.KAGGLE_API_KEY,
    };
    
    // Fetch competitions using Kaggle CLI (get more results)
    const { stdout } = await execAsync(
      'kaggle competitions list --page-size 100 --csv',
      { env, timeout: getTimeout() }
    );
    
    // Parse CSV output
    const lines = stdout.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('No competitions returned from Kaggle CLI');
    }
    
    // Skip header line and parse competitions
    const competitions = lines.slice(1).map(line => {
      // CSV format: ref,deadline,category,reward,teamCount,userHasEntered
      const parts = line.split(',');
      if (parts.length < 2) return null;
      
      const ref = parts[0];
      const deadline = parts[1];
      const category = parts[2] || 'Featured';
      const reward = parts[3] || null;
      
      return {
        ref,
        title: ref.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        url: ref,
        deadline,
        category,
        reward,
      };
    }).filter(Boolean);
    
    const parsed = parseKaggleResponse({ competitions });
    
    if (parsed.error) {
      await createSyncLog({
        source: 'kaggle',
        status: 'error',
        errorMessage: parsed.error.message,
      });
      return { source: 'kaggle', success: false, error: parsed.error.message, processed: 0 };
    }
    
    const upsertResult = await upsertCompetitions(parsed.competitions);
    await createSyncLog({
      source: 'kaggle',
      status: 'success',
      recordCount: upsertResult.total,
    });
    
    return { source: 'kaggle', success: true, processed: upsertResult.total, ...upsertResult };
  } catch (error) {
    await createSyncLog({
      source: 'kaggle',
      status: 'error',
      errorMessage: error.message,
    });
    return { source: 'kaggle', success: false, error: error.message, processed: 0 };
  }
}

export async function syncAll() {
  const results = await Promise.all([syncKontests(), syncCLIST(), syncKaggle()]);
  return {
    results,
    successCount: results.filter((item) => item.success).length,
    failureCount: results.filter((item) => !item.success).length,
    totalProcessed: results.reduce((sum, item) => sum + (item.processed ?? 0), 0),
  };
}

export async function getSyncLogs({ page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const offset = (safePage - 1) * safeLimit;

  const [itemsResult, countResult] = await Promise.all([
    query(`SELECT * FROM sync_logs ORDER BY synced_at DESC LIMIT $1 OFFSET $2`, [
      safeLimit,
      offset,
    ]),
    query(`SELECT COUNT(*)::int AS count FROM sync_logs`),
  ]);

  const totalCount = countResult.rows[0]?.count ?? 0;
  return {
    logs: itemsResult.rows,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / safeLimit)),
    page: safePage,
    limit: safeLimit,
  };
}
