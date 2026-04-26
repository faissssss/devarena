import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src/utils/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  try {
    // Check for competitions with location != 'Online'
    const result = await query(
      `SELECT title, start_date, platform, location, url
       FROM competitions
       WHERE location != 'Online'
       ORDER BY start_date
       LIMIT 20`
    );
    
    console.log(`Found ${result.rows.length} on-site competitions:\n`);
    
    result.rows.forEach((comp, index) => {
      console.log(`${index + 1}. ${comp.title}`);
      console.log('   Platform:', comp.platform);
      console.log('   Location:', comp.location);
      console.log('   URL:', comp.url);
      console.log('');
    });
    
    // Also check total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM competitions WHERE location != 'Online'`
    );
    
    console.log(`Total on-site competitions: ${countResult.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
