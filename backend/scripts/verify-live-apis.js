import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import {
  parseCLISTResponse,
  parseKaggleResponse,
  parseKontestsResponse,
} from '../src/parsers/apiResponseParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

function buildClistRequestConfig() {
  const config = {
    timeout: Number(process.env.SYNC_TIMEOUT || 30000),
  };

  if (process.env.CLIST_USERNAME && process.env.CLIST_API_KEY) {
    config.params = {
      username: process.env.CLIST_USERNAME,
      api_key: process.env.CLIST_API_KEY,
    };
  }

  if (process.env.CLIST_API_KEY) {
    config.headers = {
      Authorization: `Token ${process.env.CLIST_API_KEY}`,
    };
  }

  return config;
}

function buildKaggleRequestConfig() {
  const config = {
    timeout: Number(process.env.SYNC_TIMEOUT || 30000),
  };

  if (process.env.KAGGLE_USERNAME && process.env.KAGGLE_API_KEY) {
    config.auth = {
      username: process.env.KAGGLE_USERNAME,
      password: process.env.KAGGLE_API_KEY,
    };
  }

  return config;
}

async function verifySource({ source, url, parser, requestConfig }) {
  const response = await axios.get(url, requestConfig);
  const parsed = parser(response.data);

  if (parsed.error) {
    throw new Error(parsed.error.message);
  }

  return {
    source,
    total: parsed.competitions.length,
    sample: parsed.competitions.slice(0, 3).map((competition) => competition.title),
  };
}

async function main() {
  const sources = [
    {
      source: 'kontests',
      url: process.env.KONTESTS_API_URL,
      parser: parseKontestsResponse,
      requestConfig: { timeout: Number(process.env.SYNC_TIMEOUT || 30000) },
    },
    {
      source: 'clist',
      url: process.env.CLIST_API_URL,
      parser: parseCLISTResponse,
      requestConfig: buildClistRequestConfig(),
    },
    {
      source: 'kaggle',
      url:
        process.env.KAGGLE_API_URL || 'https://www.kaggle.com/api/v1/competitions/list',
      parser: parseKaggleResponse,
      requestConfig: buildKaggleRequestConfig(),
    },
  ];

  for (const source of sources) {
    if (!source.url) {
      throw new Error(`Missing URL configuration for ${source.source}`);
    }
  }

  const results = [];

  for (const source of sources) {
    try {
      const result = await verifySource(source);
      results.push({ ...result, success: true });
    } catch (error) {
      results.push({
        source: source.source,
        success: false,
        error: error.message,
      });
    }
  }

  const failed = results.filter((result) => !result.success);
  console.log(JSON.stringify({ verifiedAt: new Date().toISOString(), results }, null, 2));

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Live API verification failed:', error.message);
  process.exit(1);
});
