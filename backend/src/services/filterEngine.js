import { query } from '../utils/db.js';

function pushCondition(conditions, params, sql, value) {
  params.push(value);
  conditions.push(sql.replace('?', `$${params.length}`));
}

export function buildFilterQuery(filters = {}) {
  const conditions = [];
  const params = [];

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

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(
      `(title ILIKE $${params.length} OR COALESCE(description, '') ILIKE $${params.length})`
    );
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
      `SELECT * FROM competitions ${whereClause} ORDER BY start_date ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
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
