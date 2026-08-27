import { Router } from 'express';
import { create, updateStatus, listOpen, getOne } from './pickupRequests.controller.js';
import { authRequired, requireRole } from '../../middleware/auth.js';

const router = Router();

router.post('/', authRequired, create);
router.get('/', authRequired, listOpen);
router.get('/:id', authRequired, getOne);
router.patch('/:id/status', authRequired, requireRole('staff', 'admin'), updateStatus);

export default router;
