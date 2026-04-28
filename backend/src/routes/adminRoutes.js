import { Router } from 'express';

import { authenticate, requireAdmin } from '../middleware/auth.js';
// Rate limiting removed - ZERO CONSTRAINTS for Vercel deployment
// import { syncLimiter } from '../middleware/security.js';
import { syncAll, getSyncLogs } from '../services/dataSyncService.js';
import {
  deleteCompetition,
  getPlatformStats,
  listCompetitions,
  updateCompetition,
} from '../services/competitionService.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.post('/sync', async (req, res, next) => {
  // syncLimiter removed - ZERO CONSTRAINTS for Vercel deployment
  try {
    const result = await syncAll();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/sync-logs', async (req, res, next) => {
  try {
    const logs = await getSyncLogs(req.query);
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const [stats, competitions] = await Promise.all([
      getPlatformStats(),
      listCompetitions({ page: req.query.page, limit: req.query.limit ?? 10 }),
    ]);
    res.json({ stats, competitions });
  } catch (error) {
    next(error);
  }
});

router.delete('/competitions/:id', async (req, res, next) => {
  try {
    await deleteCompetition(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: { code: 'NOT_FOUND', message: error.message },
      });
    }
    return next(error);
  }
});

router.put('/competitions/:id', async (req, res, next) => {
  try {
    const competition = await updateCompetition(req.params.id, req.body);
    res.json({ competition });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: { code: 'NOT_FOUND', message: error.message },
      });
    }
    return next(error);
  }
});

export default router;
