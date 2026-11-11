import { Router } from 'express';
import { cache } from '../middleware/cache.js';
import * as c from '../controllers/tracks.controller.js';

const router = Router();

router.get('/chart', cache(600), c.chart);
router.get('/albums/:id', cache(), c.getAlbum);
router.get('/artists/:id', cache(), c.getArtist);
// No cache: preview URLs are signed and expire, so the player refetches fresh ones
router.get('/:id', c.getTrack);

export default router;
