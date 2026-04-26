import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src/utils/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  try {
    console.log('=== CLIST Competitions (Sample) ===\n');
    
    const clistResult = await query(
      `SELECT title, start_date, end_date, platform
       FROM competitions
       WHERE source = 'clist'
       ORDER BY start_date
       LIMIT 5`
    );
    
    clistResult.rows.forEach((comp, index) => {
      const start = new Date(comp.start_date);
      const end = new Date(comp.end_date);
      const duration = Math.round((end - start) / (1000 * 60 * 60 * 24));
      
      console.log(`${index + 1}. ${comp.title}`);
      console.log('   Platform:', comp.platform);
      console.log('   Start:', start.toISOString());
      console.log('   End:', end.toISOString());
      console.log('   Duration:', duration, 'days');
      console.log('');
    });
    
    console.log('\n=== Kaggle Competitions (All) ===\n');
    
    const kaggleResult = await query(
      `SELECT title, start_date, end_date
       FROM competitions
       WHERE source = 'kaggle'
       ORDER BY end_date DESC`
    );
    
    kaggleResult.rows.forEach((comp, index) => {
      const start = new Date(comp.start_date);
      const end = new Date(comp.end_date);
      const duration = Math.round((end - start) / (1000 * 60 * 60 * 24));
      
      console.log(`${index + 1}. ${comp.title}`);
      console.log('   Start:', start.toISOString());
      console.log('   End:', end.toISOString());
      console.log('   Duration:', duration, 'days');
      console.log('');
    });
    
    console.log('\n=== Verification: "No Hack No CTF 2026" ===\n');
    
    const verifyResult = await query(
      `SELECT title, start_date, end_date, platform, url
       FROM competitions
       WHERE title ILIKE '%No Hack No CTF%'`
    );
    
    if (verifyResult.rows.length > 0) {
      const comp = verifyResult.rows[0];
      const start = new Date(comp.start_date);
      const end = new Date(comp.end_date);
      
      console.log('Title:', comp.title);
      console.log('Platform:', comp.platform);
      console.log('Start:', start.toISOString(), `(${start.toLocaleDateString()})`);
      console.log('End:', end.toISOString(), `(${end.toLocaleDateString()})`);
      console.log('URL:', comp.url);
      console.log('\n✅ Expected: July 4-6, 2026');
      console.log('✅ Actual:', `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`);
    }
    
    console.log('\n=== Summary ===\n');
    
    const summaryResult = await query(
      `SELECT source, COUNT(*) as count
       FROM competitions
       GROUP BY source
       ORDER BY source`
    );
    
    summaryResult.rows.forEach(row => {
      console.log(`${row.source}: ${row.count} competitions`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
