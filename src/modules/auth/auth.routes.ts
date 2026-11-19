import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { loginLimiter } from '../../middlewares/rateLimiter';
import { validate } from '../../middlewares/validate';
import * as controller from './auth.controller';
import { loginSchema } from './auth.validation';

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.me);

export default router;
