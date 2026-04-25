import { Router } from 'express';
import { body, validationResult } from 'express-validator';

import { authenticate } from '../middleware/auth.js';
import {
  createBookmark,
  deleteBookmark,
  findBookmarkByCompetition,
  listBookmarks,
} from '../services/bookmarkService.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const bookmarks = await listBookmarks(req.user.userId);
    res.json({ bookmarks });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  [body('competition_id').isString().notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'competition_id is required' },
      });
    }

    try {
      const bookmark = await createBookmark(req.user.userId, req.body.competition_id);
      return res.status(201).json({ bookmark });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: { code: 'BOOKMARK_ERROR', message: error.message },
        });
      }
      return next(error);
    }
  }
);

router.delete('/:id', async (req, res, next) => {
  try {
    await deleteBookmark(req.user.userId, req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: { code: 'BOOKMARK_ERROR', message: error.message },
      });
    }
    return next(error);
  }
});

router.get('/competition/:competitionId', async (req, res, next) => {
  try {
    const bookmark = await findBookmarkByCompetition(
      req.user.userId,
      req.params.competitionId
    );
    res.json({ bookmark });
  } catch (error) {
    next(error);
  }
});

export default router;
