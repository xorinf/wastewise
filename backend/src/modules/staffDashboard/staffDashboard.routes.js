import { Router } from 'express';
import { dashboard, crossCampus } from './staffDashboard.controller.js';
import { authRequired, requireRole } from '../../middleware/auth.js';

const router = Router();

router.get('/', authRequired, requireRole('staff', 'admin'), dashboard);
router.get('/cross-campus', authRequired, requireRole('admin'), crossCampus);

export default router;
