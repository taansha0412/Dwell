import { Router } from 'express';
import { resolve } from '../controllers/playback.controller.js';

const router = Router();
router.get('/', resolve); // never cached: depends on your uploads
export default router;
