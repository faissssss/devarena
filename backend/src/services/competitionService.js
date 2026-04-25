import { query } from '../utils/db.js';

export function updateCompetitionStatus(competition, now = new Date()) {
  const currentTime = new Date(now).getTime();
  const startTime = new Date(competition.start_date).getTime();
  const endTime = new Date(competition.end_date).getTime();

  if (startTime > currentTime) {
    return 'upcoming';
  }

  if (endTime <= currentTime) {
    return 'ended';
  }

  return 'ongoing';
}

function mapCompetitionInput(competition) {
  return {
    ...competition,
    status: updateCompetitionStatus(competition),
    location: competition.location ?? 'Online',
    description: competition.description ?? null,
    prize: competition.prize ?? null,
    difficulty: competition.difficulty ?? null,
  };
}

export async function upsertCompetitions(competitions) {
  let inserted = 0;
  let updated = 0;

  for (const item of competitions.map(mapCompetitionInput)) {
    const existing = await query(
      `SELECT id FROM competitions WHERE title = $1 AND platform = $2 AND start_date = $3`,
      [item.title, item.platform, item.start_date]
    );

    await query(
      `INSERT INTO competitions (
        title, description, category, platform, url, start_date, end_date, status,
        location, prize, difficulty, source, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, NOW()
      )
      ON CONFLICT (title, platform, start_date)
      DO UPDATE SET
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        url = EXCLUDED.url,
        end_date = EXCLUDED.end_date,
        status = EXCLUDED.status,
        location = EXCLUDED.location,
        prize = EXCLUDED.prize,
        difficulty = EXCLUDED.difficulty,
        updated_at = NOW()`,
      [
        item.title,
        item.description,
        item.category,
        item.platform,
        item.url,
        item.start_date,
        item.end_date,
        item.status,
        item.location,
        item.prize,
        item.difficulty,
        item.source,
      ]
    );

    if (existing.rowCount > 0) {
      updated += 1;
    } else {
      inserted += 1;
    }
  }

  return { inserted, updated, total: competitions.length };
}

export async function getCompetitionById(id) {
  const result = await query(`SELECT * FROM competitions WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function deleteCompetition(id) {
  const result = await query(`DELETE FROM competitions WHERE id = $1 RETURNING id`, [id]);
  if (result.rowCount === 0) {
    const error = new Error('Competition not found');
    error.statusCode = 404;
    throw error;
  }

  return true;
}

export async function updateCompetition(id, updates) {
  const existing = await getCompetitionById(id);
  if (!existing) {
    const error = new Error('Competition not found');
    error.statusCode = 404;
    throw error;
  }

  const merged = { ...existing, ...updates, source: existing.source };
  const status = updateCompetitionStatus(merged);
  const result = await query(
    `UPDATE competitions
     SET title = $2,
         description = $3,
         category = $4,
         platform = $5,
         url = $6,
         start_date = $7,
         end_date = $8,
         status = $9,
         location = $10,
         prize = $11,
         difficulty = $12,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      merged.title,
      merged.description,
      merged.category,
      merged.platform,
      merged.url,
      merged.start_date,
      merged.end_date,
      status,
      merged.location,
      merged.prize,
      merged.difficulty,
    ]
  );

  return result.rows[0];
}

export async function listCompetitions({ page = 1, limit = 20 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safeLimit;

  const [itemsResult, countResult] = await Promise.all([
    query(`SELECT * FROM competitions ORDER BY start_date ASC LIMIT $1 OFFSET $2`, [
      safeLimit,
      offset,
    ]),
    query(`SELECT COUNT(*)::int AS count FROM competitions`),
  ]);

  const totalCount = countResult.rows[0]?.count ?? 0;
  return {
    competitions: itemsResult.rows,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / safeLimit)),
    page: safePage,
    limit: safeLimit,
  };
}

export async function getPlatformStats() {
  const [users, competitions, bookmarks] = await Promise.all([
    query(`SELECT COUNT(*)::int AS count FROM users`),
    query(`SELECT COUNT(*)::int AS count FROM competitions`),
    query(`SELECT COUNT(*)::int AS count FROM bookmarks`),
  ]);

  return {
    userCount: users.rows[0]?.count ?? 0,
    competitionCount: competitions.rows[0]?.count ?? 0,
    bookmarkCount: bookmarks.rows[0]?.count ?? 0,
  };
}
