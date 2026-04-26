import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { query } from '../src/utils/db.js';
import { syncAll } from '../src/services/dataSyncService.js';

async function main() {
  try {
    console.log('Clearing existing competitions...');
    await query('DELETE FROM competitions');
    console.log('✓ Competitions cleared\n');
    
    console.log('Starting fresh data sync...\n');
    const syncData = await syncAll();
    const results = syncData.results;
    
    console.log('\n=== Sync Results ===');
    console.log(`Total sources: ${results.length}`);
    
    results.forEach(result => {
      console.log(`\n${result.source}:`);
      console.log(`  Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`  Records: ${result.processed || 0}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
    
    console.log(`\nSuccess: ${syncData.successCount}/${results.length}`);
    console.log(`Total competitions synced: ${syncData.totalProcessed}`);
    
    // Show platform distribution
    console.log('\n=== Platform Distribution ===');
    const platformResult = await query('SELECT DISTINCT platform, COUNT(*) as count FROM competitions GROUP BY platform ORDER BY count DESC LIMIT 20');
    platformResult.rows.forEach(row => {
      console.log(`${row.platform}: ${row.count} competitions`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
