import { validateToken } from '../services/authService.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      },
    });
  }

  try {
    const token = authHeader.slice('Bearer '.length);
    req.user = validateToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
    });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Admin access required' },
    });
  }

  return next();
}
