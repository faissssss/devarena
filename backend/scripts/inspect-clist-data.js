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
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneEightyDaysFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    
    const config = {
      params: {
        username: process.env.CLIST_USERNAME,
        api_key: process.env.CLIST_API_KEY,
        start__gte: sevenDaysAgo.toISOString(),
        start__lte: oneEightyDaysFromNow.toISOString(),
        limit: 5,
        order_by: 'start',
      }
    };
    
    console.log('Fetching recent/upcoming competitions from CLIST API...\n');
    
    const response = await axios.get(url, config);
    
    console.log(`Found ${response.data.objects?.length || 0} competitions\n`);
    
    if (response.data.objects && response.data.objects.length > 0) {
      response.data.objects.forEach((comp, index) => {
        console.log(`\n=== Competition ${index + 1} ===`);
        console.log('Event:', comp.event);
        console.log('Start:', comp.start);
        console.log('End:', comp.end);
        console.log('Duration:', comp.duration, 'seconds');
        console.log('Resource:', comp.resource);
        console.log('Host:', comp.host);
        console.log('Location:', comp.location || 'N/A');
        console.log('Description:', comp.description ? comp.description.substring(0, 100) + '...' : 'N/A');
        console.log('URL:', comp.href);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
