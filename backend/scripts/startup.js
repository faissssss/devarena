import dotenv from 'dotenv';

import {
  runAllMigrations,
  verifySchema,
  closeMigrationPool,
} from '../migrations/run-migrations.js';
import { startServer } from '../src/server.js';

dotenv.config();

async function startup() {
  await runAllMigrations();
  await verifySchema();
  await closeMigrationPool();
  startServer(process.env.PORT || 3000);
}

startup().catch((error) => {
  console.error('Startup failed:', error);
  process.exit(1);
});
