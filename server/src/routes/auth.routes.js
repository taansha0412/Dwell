import { Router } from 'express';
import { asyncHandler as h } from '../middleware/errorHandler.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import * as auth from '../services/auth.service.js';

const router = Router();
const limit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

router.post('/register', limit, h(async (req, res) =>
  res.status(201).json(await auth.register(req.body.username, req.body.password))));
router.post('/login', limit, h(async (req, res) =>
  res.json(await auth.login(req.body.username, req.body.password))));
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));
router.post('/logout', requireAuth, h(async (req, res) => {
  await auth.logout(req.token);
  res.status(204).end();
}));

export default router;
