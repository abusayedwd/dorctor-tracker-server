import Joi from 'joi';
import type { RequestSchema } from '../../middlewares/validate';

export const loginSchema: RequestSchema = {
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().min(1).max(128).required(),
  }),
};
