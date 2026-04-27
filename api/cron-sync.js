import { syncAll } from '../backend/src/services/dataSyncService.js';

export default async function handler(request, response) {
  const authHeader = request.headers.authorization;

  if (!process.env.CRON_SECRET) {
    return response.status(500).json({
      success: false,
      error: 'CRON_SECRET is not configured',
    });
  }

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  try {
    const result = await syncAll();
    return response.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: error.message || 'Sync failed',
    });
  }
}
