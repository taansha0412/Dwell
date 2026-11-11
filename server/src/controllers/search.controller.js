import * as music from '../services/musicApi.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ tracks: [], albums: [], artists: [] });
  res.json(await music.search(q));
});
