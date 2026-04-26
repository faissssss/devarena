import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { query } from '../src/utils/db.js';

async function main() {
  try {
    // Check distinct platforms
    const result = await query('SELECT DISTINCT platform, source, COUNT(*) as count FROM competitions GROUP BY platform, source ORDER BY count DESC LIMIT 20');
    
    console.log('Platform distribution in database:');
    console.log('=====================================');
    result.rows.forEach(row => {
      console.log(`${row.platform} (source: ${row.source}) - ${row.count} competitions`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
