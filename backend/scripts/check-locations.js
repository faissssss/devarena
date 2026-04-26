import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { query } from '../src/utils/db.js';

async function main() {
  try {
    const result = await query('SELECT title, platform, location, description FROM competitions LIMIT 10');
    
    console.log('Sample competitions with location data:');
    console.log('=========================================\n');
    result.rows.forEach(row => {
      console.log(`Title: ${row.title}`);
      console.log(`Platform: ${row.platform}`);
      console.log(`Location: ${row.location}`);
      console.log(`Description: ${row.description ? row.description.substring(0, 80) + '...' : 'N/A'}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
