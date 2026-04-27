import { Router } from 'express';

import { executeFilter, getAvailablePlatforms } from '../services/filterEngine.js';
import { getCompetitionById } from '../services/competitionService.js';
import {
  getLiveCompetitionById,
  getLivePlatforms,
  listLiveCompetitions,
} from '../services/liveCompetitionService.js';

const router = Router();

function buildEmptyCompetitionResponse(filters = {}) {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.max(1, Math.min(Number(filters.limit) || 12, 100));

  return {
    competitions: [],
    totalCount: 0,
    totalPages: 1,
    page,
    limit,
  };
}

router.get('/', async (req, res, next) => {
  try {
    // Parse platforms parameter from comma-separated string to array
    const filters = { ...req.query };
    if (filters.platforms && typeof filters.platforms === 'string') {
      filters.platforms = filters.platforms.split(',').map(p => p.trim()).filter(Boolean);
    }
    
    try {
      const result = await executeFilter(filters);
      return res.json(result);
    } catch (dbError) {
      try {
        const liveResult = await listLiveCompetitions(filters);
        return res.json(liveResult);
      } catch (liveError) {
        console.error('Competition list fallback failed', {
          dbError: dbError.message,
          liveError: liveError.message,
        });
        return res.json(buildEmptyCompetitionResponse(filters));
      }
    }
  } catch (error) {
    return next(error);
  }
});

router.get('/platforms', async (req, res, next) => {
  try {
    let platforms;

    try {
      platforms = await getAvailablePlatforms();
    } catch (dbError) {
      platforms = await getLivePlatforms();
    }

    if (!platforms?.length) {
      platforms = await getLivePlatforms();
    }

    res.json({ platforms });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    let competition;

    try {
      competition = await getCompetitionById(req.params.id);
    } catch (dbError) {
      competition = await getLiveCompetitionById(req.params.id);
    }

    if (!competition) {
      competition = await getLiveCompetitionById(req.params.id);
    }

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
