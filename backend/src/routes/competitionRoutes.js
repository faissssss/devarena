import { Router } from 'express';

import { executeFilter, getAvailablePlatforms } from '../services/filterEngine.js';
import { getCompetitionById } from '../services/competitionService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    // Parse platforms parameter from comma-separated string to array
    const filters = { ...req.query };
    if (filters.platforms && typeof filters.platforms === 'string') {
      filters.platforms = filters.platforms.split(',').map(p => p.trim()).filter(Boolean);
    }
    
    const result = await executeFilter(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/platforms', async (req, res, next) => {
  try {
    const platforms = await getAvailablePlatforms();
    res.json({ platforms });
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
