import { Router } from 'express';
import { cache } from '../middleware/cache.js';
import { search } from '../controllers/search.controller.js';

const router = Router();
router.get('/', cache(120), search);
export default router;
