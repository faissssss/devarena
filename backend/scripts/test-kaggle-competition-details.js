import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  try {
    // Try to get details for a specific competition
    const competitionSlug = 'arc-prize-2026-arc-agi-3';
    
    console.log(`Fetching details for: ${competitionSlug}\n`);
    
    // Try the Kaggle API endpoint for competition details
    const response = await axios.get(`https://www.kaggle.com/api/v1/competitions/data/list/${competitionSlug}`, {
      auth: {
        username: process.env.KAGGLE_USERNAME,
        password: process.env.KAGGLE_API_KEY,
      },
      timeout: 30000,
    });
    
    console.log('Response received!\n');
    console.log(JSON.stringify(response.data, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Try alternative: scrape the competition page
    console.log('\n\nTrying to fetch competition page HTML...\n');
    
    try {
      const htmlResponse = await axios.get('https://www.kaggle.com/competitions/arc-prize-2026-arc-agi-3', {
        timeout: 30000,
      });
      
      // Look for date information in the HTML
      const html = htmlResponse.data;
      
      // Search for common date patterns
      const datePatterns = [
        /enabledDate["\s:]+([^"<,]+)/gi,
        /startDate["\s:]+([^"<,]+)/gi,
        /deadline["\s:]+([^"<,]+)/gi,
        /deadlineDate["\s:]+([^"<,]+)/gi,
      ];
      
      console.log('Searching for dates in HTML...\n');
      
      datePatterns.forEach(pattern => {
        const matches = html.match(pattern);
        if (matches) {
          console.log('Found:', matches.slice(0, 3));
        }
      });
      
    } catch (htmlError) {
      console.error('HTML fetch error:', htmlError.message);
    }
    
    process.exit(1);
  }
}

main();
