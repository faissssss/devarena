import crypto from 'crypto';
import axios from 'axios';

import { parseCLISTResponse, parseKontestsResponse } from '../parsers/apiResponseParser.js';
import { updateCompetitionStatus } from './competitionService.js';

function getTimeout() {
  return Math.min(Number(process.env.SYNC_TIMEOUT || 30000), 5000);
}

function buildClistRequestConfig() {
  const config = {
    timeout: getTimeout(),
    params: {},
  };

  if (process.env.CLIST_USERNAME && process.env.CLIST_API_KEY) {
    config.params.username = process.env.CLIST_USERNAME;
    config.params.api_key = process.env.CLIST_API_KEY;
  }

  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  config.params.start__gte = oneYearAgo.toISOString();
  config.params.start__lte = oneYearFromNow.toISOString();
  config.params.order_by = 'start';
  config.params.limit = 500;
  config.params.with_problems = 'false';

  return config;
}

function buildLiveId(competition) {
  const fingerprint = [
    competition.source,
    competition.platform,
    competition.title,
    competition.start_date,
    competition.end_date,
  ].join('|');

  return `live_${crypto.createHash('sha1').update(fingerprint).digest('hex').slice(0, 24)}`;
}

function enrichCompetition(competition) {
  return {
    ...competition,
    id: competition.id || buildLiveId(competition),
    status: competition.status || updateCompetitionStatus(competition),
    location: competition.location || 'Online',
  };
}

function dedupeCompetitions(competitions) {
  const seen = new Map();

  for (const competition of competitions.map(enrichCompetition)) {
    const key = [
      competition.source,
      competition.platform,
      competition.title,
      competition.start_date,
      competition.end_date,
    ].join('|');

    if (!seen.has(key)) {
      seen.set(key, competition);
    }
  }

  return Array.from(seen.values());
}

function applyFilters(competitions, filters = {}) {
  const startOf2024 = new Date('2024-01-01T00:00:00.000Z').getTime();
  let items = competitions.filter((competition) => {
    const end = new Date(competition.end_date).getTime();
    return competition.status === 'upcoming' || competition.status === 'ongoing' || end >= startOf2024;
  });

  if (filters.category) {
    items = items.filter((competition) => competition.category === filters.category);
  }

  if (filters.status) {
    items = items.filter((competition) => competition.status === filters.status);
  }

  if (filters.source) {
    items = items.filter((competition) => competition.source === filters.source);
  }

  if (filters.platforms && Array.isArray(filters.platforms) && filters.platforms.length > 0) {
    const selected = new Set(filters.platforms);
    items = items.filter((competition) => selected.has(competition.platform));
  }

  if (filters.search) {
    const query = String(filters.search).toLowerCase();
    items = items.filter((competition) =>
      String(competition.title || '').toLowerCase().includes(query) ||
      String(competition.description || '').toLowerCase().includes(query)
    );
  }

  if (filters.startDate && filters.endDate) {
    const rangeStart = new Date(filters.startDate).getTime();
    const rangeEnd = new Date(filters.endDate).getTime();

    items = items.filter((competition) => {
      const start = new Date(competition.start_date).getTime();
      const end = new Date(competition.end_date).getTime();
      return (
        (start >= rangeStart && start <= rangeEnd) ||
        (end >= rangeStart && end <= rangeEnd) ||
        (start <= rangeStart && end >= rangeEnd)
      );
    });
  }

  items.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  return items;
}

export async function fetchLiveCompetitions() {
  const requests = [
    process.env.KONTESTS_API_URL
      ? axios
          .get(process.env.KONTESTS_API_URL, { timeout: getTimeout() })
          .then((response) => parseKontestsResponse(response.data).competitions || [])
          .catch(() => [])
      : Promise.resolve([]),
    process.env.CLIST_API_URL
      ? axios
          .get(process.env.CLIST_API_URL, buildClistRequestConfig())
          .then((response) => parseCLISTResponse(response.data).competitions || [])
          .catch(() => [])
      : Promise.resolve([]),
  ];

  const results = await Promise.all(requests);
  return dedupeCompetitions(results.flat());
}

export async function listLiveCompetitions(filters = {}) {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.max(1, Math.min(Number(filters.limit) || 12, 100));
  const filtered = applyFilters(await fetchLiveCompetitions(), filters);
  const offset = (page - 1) * limit;

  return {
    competitions: filtered.slice(offset, offset + limit),
    totalCount: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
    page,
    limit,
  };
}

export async function getLiveCompetitionById(id) {
  const competitions = await fetchLiveCompetitions();
  return competitions.find((competition) => competition.id === id) ?? null;
}

export async function getLivePlatforms() {
  const competitions = await fetchLiveCompetitions();
  return Array.from(new Set(competitions.map((competition) => competition.platform).filter(Boolean))).sort();
}
