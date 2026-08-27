import { Router } from 'express';
import { list, create, getOne, addBin, setBinCoords, setCampusBounds, mapZoneStaff, nearestBin } from './campuses.controller.js';
import { authRequired, requireRole } from '../../middleware/auth.js';

const router = Router();

router.get('/', list);
router.get('/:id', getOne);
router.get('/:id/nearest-bin', authRequired, nearestBin);
router.post('/', authRequired, requireRole('admin'), create);
router.post('/:id/bins', authRequired, requireRole('admin'), addBin);
router.post('/:id/bins/:building/:floor/:binId/coords', authRequired, requireRole('admin'), setBinCoords);
router.patch('/:id/bounds', authRequired, requireRole('admin'), setCampusBounds);
router.post('/:id/zone-staff', authRequired, requireRole('admin'), mapZoneStaff);

export default router;
