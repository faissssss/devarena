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
        limit: 3,
      }
    };
    
    console.log('Fetching from CLIST API...');
    console.log('URL:', url);
    
    const response = await axios.get(url, config);
    
    console.log('\nResponse structure:');
    console.log('Objects count:', response.data.objects?.length || 0);
    
    if (response.data.objects && response.data.objects.length > 0) {
      console.log('\nFirst competition sample:');
      const first = response.data.objects[0];
      console.log(JSON.stringify(first, null, 2));
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
