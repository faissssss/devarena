import cron from 'node-cron';

import { syncAll } from './services/dataSyncService.js';

let task = null;

export function startScheduler() {
  if (task) {
    return task;
  }

  const schedule = process.env.SYNC_SCHEDULE || '0 */6 * * *';
  task = cron.schedule(schedule, async () => {
    console.log('Scheduled sync started');
    const result = await syncAll();
    console.log('Scheduled sync completed', result);
  });

  return task;
}

export function stopScheduler() {
  if (task) {
    task.stop();
    task = null;
  }
}
