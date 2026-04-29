import cron from 'node-cron';

import { syncAll } from './services/dataSyncService.js';
import logger from './utils/logger.js';

let task = null;

export function startScheduler() {
  if (task) {
    return task;
  }

  const schedule = process.env.SYNC_SCHEDULE || '0 */6 * * *';
  task = cron.schedule(schedule, async () => {
    logger.info('Scheduled sync started');
    try {
      const result = await syncAll();
      logger.info('Scheduled sync completed', { result });
    } catch (error) {
      logger.error('Scheduled sync failed', { error: error.message, stack: error.stack });
    }
  });

  return task;
}

export function stopScheduler() {
  if (task) {
    task.stop();
    task = null;
  }
}
