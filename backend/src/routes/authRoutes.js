import { Router } from 'express';
import { body, validationResult } from 'express-validator';

import { login, register } from '../services/authService.js';

const router = Router();

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: errors.array(),
      },
    });
    return false;
  }

  return true;
}

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3 }),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
  ],
  async (req, res, next) => {
    if (!handleValidation(req, res)) {
      return;
    }

    try {
      const user = await register(req.body);
      res.status(201).json({ user });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: { code: error.code ?? 'AUTH_ERROR', message: error.message },
        });
      }
      return next(error);
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').isLength({ min: 1 })],
  async (req, res, next) => {
    if (!handleValidation(req, res)) {
      return;
    }

    try {
      const result = await login(req.body);
      res.json(result);
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: { code: error.code ?? 'AUTH_ERROR', message: error.message },
        });
      }
      return next(error);
    }
  }
);

export default router;
