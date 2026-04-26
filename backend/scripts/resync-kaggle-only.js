import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src/utils/db.js';
import { syncKaggle } from '../src/services/dataSyncService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  try {
    console.log('Deleting existing Kaggle competitions...\n');
    
    const deleteResult = await query(`DELETE FROM competitions WHERE platform = 'Kaggle'`);
    console.log(`Deleted ${deleteResult.rowCount} Kaggle competitions\n`);
    
    console.log('Re-syncing Kaggle competitions...\n');
    
    const syncResult = await syncKaggle();
    
    console.log('\n=== Sync Result ===');
    console.log('Success:', syncResult.success);
    console.log('Processed:', syncResult.processed);
    if (syncResult.error) {
      console.log('Error:', syncResult.error);
    }
    
    // Verify the results
    console.log('\n\n=== Verifying Kaggle Competitions ===\n');
    
    const verifyResult = await query(
      `SELECT title, start_date, end_date, url
       FROM competitions
       WHERE platform = 'Kaggle'
       ORDER BY end_date DESC
       LIMIT 10`
    );
    
    console.log(`Found ${verifyResult.rows.length} Kaggle competitions:\n`);
    
    verifyResult.rows.forEach((comp, index) => {
      const start = new Date(comp.start_date);
      const end = new Date(comp.end_date);
      const duration = Math.round((end - start) / (1000 * 60 * 60 * 24)); // days
      
      console.log(`${index + 1}. ${comp.title}`);
      console.log('   Start:', comp.start_date);
      console.log('   End:', comp.end_date);
      console.log('   Duration:', duration, 'days');
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
