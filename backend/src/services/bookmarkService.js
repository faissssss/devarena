import { query } from '../utils/db.js';

export async function createBookmark(userId, competitionId) {
  const competition = await query(`SELECT id FROM competitions WHERE id = $1`, [competitionId]);
  if (competition.rowCount === 0) {
    const error = new Error('Competition not found');
    error.statusCode = 404;
    throw error;
  }

  try {
    const result = await query(
      `INSERT INTO bookmarks (user_id, competition_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, competitionId]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      error.statusCode = 409;
      error.message = 'Bookmark already exists';
    }
    throw error;
  }
}

export async function deleteBookmark(userId, bookmarkId) {
  const result = await query(
    `DELETE FROM bookmarks WHERE id = $1 AND user_id = $2 RETURNING id`,
    [bookmarkId, userId]
  );

  if (result.rowCount === 0) {
    const error = new Error('Bookmark not found');
    error.statusCode = 404;
    throw error;
  }

  return true;
}

export async function listBookmarks(userId) {
  const result = await query(
    `SELECT 
      b.id,
      b.user_id,
      b.competition_id,
      b.created_at,
      row_to_json(c.*) AS competition
     FROM bookmarks b
     INNER JOIN competitions c ON c.id = b.competition_id
     WHERE b.user_id = $1
     ORDER BY c.start_date ASC`,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    competition_id: row.competition_id,
    created_at: row.created_at,
    competition: row.competition,
  }));
}

export async function findBookmarkByCompetition(userId, competitionId) {
  const result = await query(
    `SELECT * FROM bookmarks WHERE user_id = $1 AND competition_id = $2`,
    [userId, competitionId]
  );

  return result.rows[0] ?? null;
}
