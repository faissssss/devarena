import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src/utils/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  try {
    // Check Kaggle competitions in database
    const result = await query(
      `SELECT title, start_date, end_date, url
       FROM competitions
       WHERE platform = 'Kaggle'
       ORDER BY end_date DESC
       LIMIT 20`
    );
    
    console.log(`Found ${result.rows.length} Kaggle competitions in database:\n`);
    
    result.rows.forEach((comp, index) => {
      const start = new Date(comp.start_date);
      const end = new Date(comp.end_date);
      const duration = Math.round((end - start) / (1000 * 60 * 60 * 24)); // days
      
      console.log(`${index + 1}. ${comp.title}`);
      console.log('   Start:', comp.start_date);
      console.log('   End:', comp.end_date);
      console.log('   Duration:', duration, 'days');
      console.log('   URL:', comp.url);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
