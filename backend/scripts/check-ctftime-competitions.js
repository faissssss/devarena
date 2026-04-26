import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  try {
    const url = process.env.CLIST_API_URL;
    
    // Get CTFtime competitions from CLIST (resource ID 70 is ctftime.org)
    const config = {
      params: {
        username: process.env.CLIST_USERNAME,
        api_key: process.env.CLIST_API_KEY,
        resource_id: 70,
        start__gte: new Date('2026-01-01').toISOString(),
        start__lte: new Date('2026-12-31').toISOString(),
        limit: 20,
        order_by: 'start',
      }
    };
    
    console.log('Fetching CTFtime competitions for 2026 from CLIST...\n');
    
    const response = await axios.get(url, config);
    
    console.log(`Found ${response.data.objects?.length || 0} results\n`);
    
    if (response.data.objects && response.data.objects.length > 0) {
      response.data.objects.forEach((comp, index) => {
        console.log(`\n=== Result ${index + 1} ===`);
        console.log('Event:', comp.event);
        console.log('Start:', comp.start);
        console.log('End:', comp.end);
        console.log('Duration:', comp.duration, 'seconds');
        console.log('Resource:', comp.resource);
        console.log('URL:', comp.href);
      });
    }
    
    // Also check directly from CTFtime API
    console.log('\n\n=== Checking CTFtime API directly ===\n');
    
    const ctftimeResponse = await axios.get('https://ctftime.org/api/v1/events/', {
      params: {
        limit: 20,
        start: Math.floor(new Date('2026-01-01').getTime() / 1000),
        finish: Math.floor(new Date('2026-12-31').getTime() / 1000),
      }
    });
    
    console.log(`Found ${ctftimeResponse.data?.length || 0} events from CTFtime API\n`);
    
    if (ctftimeResponse.data && ctftimeResponse.data.length > 0) {
      ctftimeResponse.data.slice(0, 10).forEach((event, index) => {
        console.log(`\n=== CTFtime Event ${index + 1} ===`);
        console.log('Title:', event.title);
        console.log('Start:', event.start);
        console.log('Finish:', event.finish);
        console.log('Duration (days):', event.duration?.days);
        console.log('Duration (hours):', event.duration?.hours);
        console.log('URL:', event.url);
        console.log('Location:', event.location || 'Online');
        console.log('Description:', event.description?.substring(0, 100) || 'N/A');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();
