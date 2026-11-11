import { Router } from 'express';
import { uploadSong } from '../middleware/upload.js';
import * as c from '../controllers/library.controller.js';

const router = Router();
router.post('/upload', uploadSong, c.upload);
router.get('/stream/:id', c.stream);
router.delete('/:id', c.remove);
export default router;
