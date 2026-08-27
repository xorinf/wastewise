import { Router } from 'express';
import { signup, login, me, linkCampus } from './auth.controller.js';
import { authRequired } from '../../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authRequired, me);
router.post('/link-campus', authRequired, linkCampus);

export default router;
