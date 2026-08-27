import { Router } from 'express';
import { quickSelect, identify, logDisposal, verifyLog, myHistory, myStats } from './itemId.controller.js';
import { authRequired } from '../../middleware/auth.js';
import upload from './upload.js';

const router = Router();

router.get('/quick-select', quickSelect);
router.post('/identify', authRequired, upload.single('image'), identify);
router.post('/log', authRequired, logDisposal);
router.post('/verify/:id', authRequired, verifyLog);
router.get('/history', authRequired, myHistory);
router.get('/stats', authRequired, myStats);

export default router;
