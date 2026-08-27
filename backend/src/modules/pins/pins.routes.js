import { Router } from 'express';
import { listByCampus, create, updateStatus, nearestPin } from './pins.controller.js';
import { authRequired, requireRole } from '../../middleware/auth.js';

const router = Router();

router.get('/', authRequired, listByCampus);
router.get('/nearest', authRequired, nearestPin);
router.post('/', authRequired, requireRole('staff', 'admin'), create);
router.patch('/:id/status', authRequired, requireRole('staff', 'admin'), updateStatus);

export default router;
