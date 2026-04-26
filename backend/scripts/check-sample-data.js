import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { query } from '../src/utils/db.js';

async function main() {
  try {
    // Get sample competitions
    const result = await query('SELECT id, title, platform, source, category FROM competitions LIMIT 10');
    
    console.log('Sample competitions in database:');
    console.log('=====================================');
    result.rows.forEach(row => {
      console.log(`\nID: ${row.id}`);
      console.log(`Title: ${row.title}`);
      console.log(`Platform: ${row.platform}`);
      console.log(`Source: ${row.source}`);
      console.log(`Category: ${row.category}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
