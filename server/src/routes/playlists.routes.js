import { Router } from 'express';
import { asyncHandler as h } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import * as playlists from '../services/playlists.service.js';

const router = Router();
router.use(requireAuth); // every playlist belongs to the logged-in user

router.get('/', h(async (req, res) => res.json(await playlists.list(req.user.id))));
router.post('/', h(async (req, res) => res.status(201).json(await playlists.create(req.user.id, req.body.name))));
router.put('/order', h(async (req, res) => res.json(await playlists.reorderPlaylists(req.user.id, req.body.ids))));

router.get('/:id', h(async (req, res) => res.json(await playlists.get(req.user.id, req.params.id))));
router.patch('/:id', h(async (req, res) => res.json(await playlists.rename(req.user.id, req.params.id, req.body.name))));
router.delete('/:id', h(async (req, res) => {
  await playlists.remove(req.user.id, req.params.id);
  res.status(204).end();
}));

router.post('/:id/tracks', h(async (req, res) => res.json(await playlists.addTrack(req.user.id, req.params.id, req.body.track))));
router.put('/:id/order', h(async (req, res) => res.json(await playlists.reorderTracks(req.user.id, req.params.id, req.body.trackIds))));
router.delete('/:id/tracks/:trackId', h(async (req, res) =>
  res.json(await playlists.removeTrack(req.user.id, req.params.id, req.params.trackId))
));

export default router;
