import { asyncHandler } from './errorHandler.js';
import { getUserByToken } from '../services/auth.service.js';

// Reads "Authorization: Bearer <token>", loads the user, or answers 401.
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const user = token ? await getUserByToken(token) : null;
  if (!user) throw Object.assign(new Error('Please log in.'), { status: 401 });
  req.user = user;
  req.token = token;
  next();
});
