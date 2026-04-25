import { Router } from 'express';

import { executeFilter } from '../services/filterEngine.js';
import { getCompetitionById } from '../services/competitionService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await executeFilter(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const competition = await getCompetitionById(req.params.id);
    if (!competition) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Competition not found' },
      });
    }

    return res.json({ competition });
  } catch (error) {
    return next(error);
  }
});

export default router;
