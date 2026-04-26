import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  try {
    console.log('Fetching from CLIST API with current sync parameters...\n');
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneEightyDaysFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    
    const config = {
      params: {
        username: process.env.CLIST_USERNAME,
        api_key: process.env.CLIST_API_KEY,
        start__gte: sevenDaysAgo.toISOString(),
        start__lte: oneEightyDaysFromNow.toISOString(),
        order_by: 'start',
        limit: 500,
        with_problems: 'false',
        format_time: 'true',
      },
      timeout: 30000,
    };
    
    console.log('Query parameters:');
    console.log('  start__gte:', config.params.start__gte);
    console.log('  start__lte:', config.params.start__lte);
    console.log('  limit:', config.params.limit);
    console.log('');
    
    const response = await axios.get(process.env.CLIST_API_URL, config);
    
    console.log(`Fetched ${response.data.objects?.length || 0} competitions\n`);
    
    // Find "No Hack No CTF" in the response
    const noHackNoCtf = response.data.objects?.find(comp => 
      comp.event.toLowerCase().includes('no hack no ctf')
    );
    
    if (noHackNoCtf) {
      console.log('=== "No Hack No CTF 2026" RAW from CLIST API ===');
      console.log(JSON.stringify(noHackNoCtf, null, 2));
    } else {
      console.log('"No Hack No CTF 2026" NOT FOUND in response');
      console.log('\nThis means it\'s outside the date range we\'re querying.');
      console.log('The competition is scheduled for July 4-6, 2026, which is more than 180 days from now.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

main();
