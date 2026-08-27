import { Router } from 'express';
import { list, create, getOne, addBin, mapZoneStaff } from './campuses.controller.js';
import { authRequired, requireRole } from '../../middleware/auth.js';

const router = Router();

router.get('/', list);
router.get('/:id', getOne);
router.post('/', authRequired, requireRole('admin'), create);
router.post('/:id/bins', authRequired, requireRole('admin'), addBin);
router.post('/:id/zone-staff', authRequired, requireRole('admin'), mapZoneStaff);

export default router;
