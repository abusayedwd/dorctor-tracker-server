import { Router } from 'express';
import Joi from 'joi';
import { validate } from '../../middlewares/validate';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { timezone } from '../../utils/validators';
import { dashboardService } from './dashboard.service';

const router = Router();

const statsSchema = {
  query: Joi.object({
    days: Joi.number().integer().valid(7, 30, 90, 180, 365).default(30),
    tz: timezone.default('UTC'),
  }),
};

router.get(
  '/stats',
  validate(statsSchema),
  catchAsync(async (_req, res) => {
    const stats = await dashboardService.getStats(res.locals.validated.query);
    sendResponse(res, { message: 'Dashboard statistics', data: stats });
  }),
);

export default router;
