import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src/utils/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  try {
    // Check a few CTFtime competitions in our database
    const result = await query(
      `SELECT title, start_date, end_date, platform, location, description, url
       FROM competitions
       WHERE platform = 'ctftime.org'
       AND start_date >= '2026-01-01'
       AND start_date < '2026-02-01'
       ORDER BY start_date
       LIMIT 10`
    );
    
    console.log(`Found ${result.rows.length} CTFtime competitions in database for January 2026:\n`);
    
    result.rows.forEach((comp, index) => {
      console.log(`\n=== Competition ${index + 1} ===`);
      console.log('Title:', comp.title);
      console.log('Start:', comp.start_date);
      console.log('End:', comp.end_date);
      console.log('Platform:', comp.platform);
      console.log('Location:', comp.location);
      console.log('Description:', comp.description || 'N/A');
      console.log('URL:', comp.url);
    });
    
    // Also check for "No Hack No CTF"
    console.log('\n\n=== Searching for "No Hack No CTF" ===\n');
    
    const searchResult = await query(
      `SELECT title, start_date, end_date, platform, location, description, url
       FROM competitions
       WHERE title ILIKE '%No Hack No CTF%'
       LIMIT 5`
    );
    
    if (searchResult.rows.length > 0) {
      searchResult.rows.forEach((comp, index) => {
        console.log(`\n=== Result ${index + 1} ===`);
        console.log('Title:', comp.title);
        console.log('Start:', comp.start_date);
        console.log('End:', comp.end_date);
        console.log('Platform:', comp.platform);
        console.log('Location:', comp.location);
        console.log('Description:', comp.description || 'N/A');
        console.log('URL:', comp.url);
      });
    } else {
      console.log('No results found for "No Hack No CTF"');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
