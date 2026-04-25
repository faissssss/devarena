import { Router } from 'express';
import { body, validationResult } from 'express-validator';

import { authenticate } from '../middleware/auth.js';
import {
  changePassword,
  getUserById,
  updateCurrentUser,
} from '../services/userService.js';
import { listBookmarks } from '../services/bookmarkService.js';

const router = Router();

router.use(authenticate);

router.get('/me', async (req, res, next) => {
  try {
    const [user, bookmarks] = await Promise.all([
      getUserById(req.user.userId),
      listBookmarks(req.user.userId),
    ]);

    res.json({
      user,
      stats: { bookmarkCount: bookmarks.length },
    });
  } catch (error) {
    next(error);
  }
});

router.put(
  '/me',
  [
    body('username').optional().trim().isLength({ min: 3 }),
    body('email').optional().isEmail(),
    body('currentPassword').optional().isLength({ min: 1 }),
    body('newPassword').optional().isLength({ min: 8 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: errors.array(),
        },
      });
    }

    try {
      let user;

      if (req.body.newPassword) {
        user = await changePassword(
          req.user.userId,
          req.body.currentPassword,
          req.body.newPassword
        );
      } else {
        user = await updateCurrentUser(req.user.userId, {
          username: req.body.username,
          email: req.body.email,
        });
      }

      res.json({ user });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: { code: 'USER_ERROR', message: error.message },
        });
      }
      return next(error);
    }
  }
);

export default router;
