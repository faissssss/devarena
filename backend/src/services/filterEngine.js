import { query } from '../utils/db.js';

function pushCondition(conditions, params, sql, value) {
  params.push(value);
  conditions.push(sql.replace('?', `$${params.length}`));
}

/**
 * Build SQL filter for date range queries
 * Returns competitions that overlap with the specified date range
 * @param {string} startDate - ISO 8601 date string for range start
 * @param {string} endDate - ISO 8601 date string for range end
 * @param {Array} params - Array to push parameter values to
 * @returns {string} SQL WHERE clause fragment
 */
export function buildDateRangeFilter(startDate, endDate, params) {
  const startParamIndex = params.length + 1;
  const endParamIndex = params.length + 2;
  params.push(startDate, endDate);
  
  // Competitions that overlap with the date range:
  // 1. Competition starts within range
  // 2. Competition ends within range
  // 3. Competition spans the entire range
  return `((start_date BETWEEN $${startParamIndex} AND $${endParamIndex}) OR (end_date BETWEEN $${startParamIndex} AND $${endParamIndex}) OR (start_date <= $${startParamIndex} AND end_date >= $${endParamIndex}))`;
}

/**
 * Build SQL filter for single date queries
 * Returns competitions that are active on the specified date
 * @param {string} date - ISO 8601 date string
 * @param {Array} params - Array to push parameter values to
 * @returns {string} SQL WHERE clause fragment
 */
export function buildSingleDateFilter(date, params) {
  const paramIndex = params.length + 1;
  params.push(date);
  
  // Competition is active on the specific date
  return `(start_date <= $${paramIndex} AND end_date >= $${paramIndex})`;
}

/**
 * Build SQL filter for platform multi-select queries
 * Returns competitions from any of the selected platforms (OR logic)
 * @param {Array<string>} platforms - Array of platform names
 * @param {Array} params - Array to push parameter values to
 * @returns {string} SQL WHERE clause fragment
 */
export function buildPlatformFilter(platforms, params) {
  if (!Array.isArray(platforms) || platforms.length === 0) {
    return '';
  }
  
  const placeholders = platforms.map((platform) => {
    params.push(platform);
    return `$${params.length}`;
  }).join(', ');
  
  return `platform IN (${placeholders})`;
}

/**
 * Query distinct platform values from competitions table
 * Returns sorted list of actual platform names for filter options
 * @returns {Promise<Array<string>>} Array of platform names
 */
export async function getAvailablePlatforms() {
  const result = await query(
    'SELECT DISTINCT platform FROM competitions WHERE platform IS NOT NULL ORDER BY platform ASC'
  );
  return result.rows.map(row => row.platform);
}

export function buildFilterQuery(filters = {}) {
  const conditions = [];
  const params = [];

  // Filter out very old competitions (before 2024)
  // Keep all upcoming and ongoing competitions regardless of date
  // For ended competitions, only show those from 2024 onwards
  const startOf2024 = new Date('2024-01-01T00:00:00.000Z');
  
  params.push(startOf2024.toISOString());
  conditions.push(
    `(status IN ('upcoming', 'ongoing') OR (status = 'ended' AND end_date >= $${params.length}))`
  );

  if (filters.category) {
    pushCondition(conditions, params, 'category = ?', filters.category);
  }

  if (filters.status) {
    pushCondition(conditions, params, 'status = ?', filters.status);
  }

  if (filters.location) {
    pushCondition(conditions, params, 'location ILIKE ?', `%${filters.location}%`);
  }

  if (filters.deadline) {
    pushCondition(conditions, params, 'end_date <= ?', filters.deadline);
  }

  if (filters.prize) {
    pushCondition(conditions, params, 'prize ILIKE ?', `%${filters.prize}%`);
  }

  if (filters.difficulty) {
    pushCondition(conditions, params, 'difficulty = ?', filters.difficulty);
  }

  if (filters.source) {
    pushCondition(conditions, params, 'source = ?', filters.source);
  }

  // Platform multi-select filtering (OR logic for multiple platforms)
  if (filters.platforms && Array.isArray(filters.platforms) && filters.platforms.length > 0) {
    const platformFilter = buildPlatformFilter(filters.platforms, params);
    if (platformFilter) {
      conditions.push(platformFilter);
    }
  }

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(
      `(title ILIKE $${params.length} OR COALESCE(description, '') ILIKE $${params.length})`
    );
  }

  // Date filtering: support either single date or date range
  if (filters.singleDate) {
    conditions.push(buildSingleDateFilter(filters.singleDate, params));
  } else if (filters.startDate && filters.endDate) {
    conditions.push(buildDateRangeFilter(filters.startDate, filters.endDate, params));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

export async function executeFilter(filters = {}) {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.max(1, Math.min(Number(filters.limit) || 12, 100));
  const offset = (page - 1) * limit;
  const { whereClause, params } = buildFilterQuery(filters);

  const [itemsResult, countResult] = await Promise.all([
    query(
      `SELECT * FROM competitions ${whereClause} ORDER BY start_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    query(`SELECT COUNT(*)::int AS count FROM competitions ${whereClause}`, params),
  ]);

  const totalCount = countResult.rows[0]?.count ?? 0;
  return {
    competitions: itemsResult.rows,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    page,
    limit,
  };
}
