import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import { query, closePool } from './src/utils/db.js';

try {
  const upcoming = await query(`
    SELECT title, status, start_date, end_date, platform 
    FROM competitions 
    WHERE status = 'upcoming' 
    ORDER BY start_date ASC 
    LIMIT 10
  `);
  
  console.log(`Upcoming competitions: ${upcoming.rows.length}`);
  upcoming.rows.forEach(c => {
    console.log(`- ${c.title} (${c.platform})`);
    console.log(`  Start: ${c.start_date}`);
  });
  
  const ongoing = await query(`
    SELECT title, status, start_date, end_date, platform 
    FROM competitions 
    WHERE status = 'ongoing' 
    ORDER BY end_date ASC 
    LIMIT 10
  `);
  console.log(`\nOngoing competitions: ${ongoing.rows.length}`);
  ongoing.rows.forEach(c => {
    console.log(`- ${c.title} (${c.platform})`);
    console.log(`  Ends: ${c.end_date}`);
  });
  
  const ended = await query(`
    SELECT COUNT(*) as count 
    FROM competitions 
    WHERE status = 'ended'
  `);
  console.log(`\nEnded competitions: ${ended.rows[0].count}`);
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await closePool();
}
