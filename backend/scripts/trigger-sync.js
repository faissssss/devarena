/**
 * Manual Sync Trigger Script
 * Triggers data synchronization from external APIs without authentication
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import sync service
import { syncAll } from '../src/services/dataSyncService.js';

async function main() {
  console.log('Starting manual data sync...\n');
  
  try {
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
    
    process.exit(0);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

main();
