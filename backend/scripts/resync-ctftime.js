import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { parseCLISTResponse } from '../src/parsers/apiResponseParser.js';
import { upsertCompetitions } from '../src/services/competitionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  try {
    console.log('Fetching CTFtime competitions from CLIST API...\n');
    
    const config = {
      params: {
        username: process.env.CLIST_USERNAME,
        api_key: process.env.CLIST_API_KEY,
        resource_id: 70, // ctftime.org
        start__gte: new Date('2026-01-01').toISOString(),
        start__lte: new Date('2026-12-31').toISOString(),
        limit: 500,
        order_by: 'start',
      },
      timeout: 30000,
    };
    
    const response = await axios.get(process.env.CLIST_API_URL, config);
    
    console.log(`Fetched ${response.data.objects?.length || 0} competitions from CLIST\n`);
    
    // Parse the response
    const parsed = parseCLISTResponse(response.data);
    
    if (parsed.error) {
      console.error('Parser error:', parsed.error);
      process.exit(1);
    }
    
    console.log(`Parsed ${parsed.competitions.length} competitions\n`);
    
    // Find "No Hack No CTF" in parsed data
    const noHackNoCtf = parsed.competitions.find(comp => 
      comp.title.toLowerCase().includes('no hack no ctf')
    );
    
    if (noHackNoCtf) {
      console.log('=== "No Hack No CTF 2026" after parsing ===');
      console.log('Title:', noHackNoCtf.title);
      console.log('Start:', noHackNoCtf.start_date);
      console.log('End:', noHackNoCtf.end_date);
      console.log('Platform:', noHackNoCtf.platform);
      console.log('Location:', noHackNoCtf.location);
      console.log('URL:', noHackNoCtf.url);
      console.log('\n');
    }
    
    // Upsert to database
    console.log('Upserting competitions to database...\n');
    const result = await upsertCompetitions(parsed.competitions);
    
    console.log('Upsert result:');
    console.log('- Total:', result.total);
    console.log('- Inserted:', result.inserted);
    console.log('- Updated:', result.updated);
    console.log('- Skipped:', result.skipped);
    
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
