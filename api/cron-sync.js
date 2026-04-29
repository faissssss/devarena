/**
 * Vercel Cron Job - Competition Data Sync
 * 
 * This serverless function is triggered by Vercel Cron (configured in vercel.json)
 * to sync competition data from external APIs every 6 hours.
 * 
 * Cron Schedule: 0 (star)/6 (star) (star) (star) - every 6 hours
 */

import { syncAll } from '../backend/src/services/dataSyncService.js';

export default async function handler(req, res) {
  // Verify this is a cron request (Vercel sets this header)
  const authHeader = req.headers.authorization;
  
  // In production, Vercel cron jobs include a secret token
  // For development, we allow requests without the header
  if (process.env.VERCEL_ENV === 'production') {
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid cron secret'
        }
      });
    }
  }

  try {
    console.log('[Cron] Starting scheduled competition data sync...');
    const result = await syncAll();
    
    console.log('[Cron] Sync completed successfully:', result);
    return res.status(200).json({
      success: true,
      message: 'Competition data sync completed',
      result
    });
  } catch (error) {
    console.error('[Cron] Sync failed:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SYNC_FAILED',
        message: error.message
      }
    });
  }
}
