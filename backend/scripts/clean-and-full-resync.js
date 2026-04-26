import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src/utils/db.js';
import { syncAll } from '../src/services/dataSyncService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  try {
    console.log('Deleting all existing competitions...\n');
    
    const deleteResult = await query('DELETE FROM competitions');
    console.log(`Deleted ${deleteResult.rowCount} competitions\n`);
    
    console.log('Starting full re-sync from all sources...\n');
    
    const syncResult = await syncAll();
    
    console.log('\n=== Sync Results ===');
    console.log('Success count:', syncResult.successCount);
    console.log('Failure count:', syncResult.failureCount);
    console.log('Total processed:', syncResult.totalProcessed);
    
    console.log('\nDetails:');
    syncResult.results.forEach(result => {
      console.log(`\n${result.source}:`);
      console.log('  Success:', result.success);
      console.log('  Processed:', result.processed);
      if (result.error) {
        console.log('  Error:', result.error);
      }
    });
    
    // Verify "No Hack No CTF" has correct dates
    console.log('\n\n=== Verifying "No Hack No CTF 2026" ===\n');
    
    const verifyResult = await query(
      `SELECT title, start_date, end_date, platform, url
       FROM competitions
       WHERE title ILIKE '%No Hack No CTF%'`
    );
    
    if (verifyResult.rows.length > 0) {
      verifyResult.rows.forEach((comp, index) => {
        console.log(`Entry ${index + 1}:`);
        console.log('  Title:', comp.title);
        console.log('  Start:', comp.start_date);
        console.log('  End:', comp.end_date);
        console.log('  Platform:', comp.platform);
        console.log('  URL:', comp.url);
        console.log('');
      });
    } else {
      console.log('No "No Hack No CTF" found in database');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
