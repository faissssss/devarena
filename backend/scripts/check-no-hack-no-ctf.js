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
    
    // Get all CTFtime 2026 competitions and search for "No Hack No CTF"
    const config = {
      params: {
        username: process.env.CLIST_USERNAME,
        api_key: process.env.CLIST_API_KEY,
        resource_id: 70, // ctftime.org
        start__gte: new Date('2026-01-01').toISOString(),
        start__lte: new Date('2026-12-31').toISOString(),
        limit: 500,
        order_by: 'start',
      }
    };
    
    console.log('Fetching all CTFtime 2026 competitions and searching for "No Hack No CTF"...\n');
    
    const response = await axios.get(url, config);
    
    if (response.data.objects && response.data.objects.length > 0) {
      // Search for "No Hack No CTF" in the results
      const matches = response.data.objects.filter(comp => 
        comp.event.toLowerCase().includes('no hack no ctf')
      );
      
      console.log(`Found ${matches.length} matches for "No Hack No CTF":\n`);
      
      matches.forEach((comp, index) => {
        console.log(`\n=== Match ${index + 1} ===`);
        console.log('Event:', comp.event);
        console.log('Start:', comp.start);
        console.log('End:', comp.end);
        console.log('Duration:', comp.duration, 'seconds');
        console.log('Resource:', comp.resource);
        console.log('URL:', comp.href);
        console.log('Description:', comp.description || 'N/A');
        console.log('Location:', comp.location || 'N/A');
      });
      
      if (matches.length === 0) {
        console.log('No matches found. Showing first 5 competitions:');
        response.data.objects.slice(0, 5).forEach((comp, index) => {
          console.log(`\n${index + 1}. ${comp.event} - ${comp.start}`);
        });
      }
    } else {
      console.log('No results found');
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
