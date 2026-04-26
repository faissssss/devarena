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
    
    const config = {
      params: {
        username: process.env.CLIST_USERNAME,
        api_key: process.env.CLIST_API_KEY,
        search: 'No Hack No CTF',
        limit: 5,
      }
    };
    
    console.log('Searching for "No Hack No CTF" competition...\n');
    
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
        console.log('\nFull object:', JSON.stringify(comp, null, 2));
      });
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
