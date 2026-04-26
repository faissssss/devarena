import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  try {
    console.log('Fetching from Kaggle API...\n');
    
    // Try the Kaggle API endpoint
    const response = await axios.get('https://www.kaggle.com/api/v1/competitions/list', {
      auth: {
        username: process.env.KAGGLE_USERNAME,
        password: process.env.KAGGLE_API_KEY,
      },
      params: {
        page: 1,
        pageSize: 10,
      },
      timeout: 30000,
    });
    
    console.log('Response received!\n');
    console.log('Sample competition data:\n');
    
    if (response.data && response.data.length > 0) {
      const sample = response.data[0];
      console.log(JSON.stringify(sample, null, 2));
      
      console.log('\n\nAll competitions:\n');
      response.data.forEach((comp, index) => {
        console.log(`${index + 1}. ${comp.title || comp.ref}`);
        console.log('   Enabled:', comp.enabledDate);
        console.log('   Deadline:', comp.deadline || comp.deadlineDate);
        console.log('   Category:', comp.category);
        console.log('');
      });
    } else {
      console.log('No data returned');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

main();
