import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    const config = {
      params: {
        username: process.env.CLIST_USERNAME,
        api_key: process.env.CLIST_API_KEY,
        start__gte: sevenDaysAgo.toISOString(),
        start__lte: oneYearFromNow.toISOString(),
        order_by: 'start',
        limit: 50,
        with_problems: 'false',
      },
      timeout: 30000,
    };
    
    console.log('Fetching competitions from CLIST to check for descriptions...\n');
    
    const response = await axios.get(process.env.CLIST_API_URL, config);
    
    const competitions = response.data.objects || [];
    
    console.log(`Fetched ${competitions.length} competitions\n`);
    
    // Count how many have descriptions
    const withDescriptions = competitions.filter(comp => comp.description && comp.description.trim());
    
    console.log(`Competitions with descriptions: ${withDescriptions.length} / ${competitions.length}\n`);
    
    if (withDescriptions.length > 0) {
      console.log('Sample competitions WITH descriptions:\n');
      withDescriptions.slice(0, 5).forEach((comp, index) => {
        console.log(`${index + 1}. ${comp.event}`);
        console.log('   Description:', comp.description.substring(0, 150) + '...');
        console.log('');
      });
    }
    
    // Show some without descriptions
    const withoutDescriptions = competitions.filter(comp => !comp.description || !comp.description.trim());
    
    if (withoutDescriptions.length > 0) {
      console.log('\nSample competitions WITHOUT descriptions:\n');
      withoutDescriptions.slice(0, 5).forEach((comp, index) => {
        console.log(`${index + 1}. ${comp.event}`);
        console.log('   Platform:', comp.resource);
        console.log('   URL:', comp.href);
        console.log('');
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
