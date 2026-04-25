import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import { query, closePool } from './src/utils/db.js';

try {
  const result = await query('SELECT COUNT(*) as count FROM competitions');
  console.log('Total competitions:', result.rows[0].count);
  
  const sample = await query('SELECT id, title, category, status, platform FROM competitions LIMIT 5');
  console.log('\nSample competitions:');
  sample.rows.forEach(c => {
    console.log(`- [${c.status}] ${c.title} (${c.category}, ${c.platform})`);
  });
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await closePool();
}
