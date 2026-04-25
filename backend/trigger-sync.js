import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import { syncAll } from './src/services/dataSyncService.js';
import { closePool } from './src/utils/db.js';

console.log('Starting data sync...\n');

try {
  const result = await syncAll();
  
  console.log('\n=== Sync Results ===');
  console.log(`Success: ${result.successCount}/${result.successCount + result.failureCount}`);
  console.log(`Total processed: ${result.totalProcessed} competitions\n`);
  
  result.results.forEach(r => {
    const status = r.success ? '✓' : '✗';
    const msg = r.success 
      ? `${r.inserted} inserted, ${r.updated} updated`
      : r.error;
    console.log(`${status} ${r.source}: ${msg}`);
  });
  
  console.log('\nSync completed!');
} catch (error) {
  console.error('Sync failed:', error.message);
  process.exit(1);
} finally {
  await closePool();
}
