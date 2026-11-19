import type { RequestHandler } from 'express';
import Joi from 'joi';
import { ApiError } from '../utils/ApiError';

export interface RequestSchema {
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  body?: Joi.ObjectSchema;
}

/**
 * Validates and *sanitises* params/query/body. Unknown keys are stripped and
 * values are converted (e.g. "2" -> 2), so controllers receive typed input.
 * Validated values are stored on `res.locals.validated`.
 */
export const validate =
  (schema: RequestSchema): RequestHandler =>
  (req, res, next) => {
    const validated: Record<string, unknown> = {};
    const errors: { field: string; message: string }[] = [];

    for (const key of ['params', 'query', 'body'] as const) {
      const part = schema[key];
      if (!part) continue;
      const { value, error } = part.validate(req[key] ?? {}, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
        errors: { wrap: { label: false } },
      });
      if (error) {
        errors.push(...error.details.map((d) => ({ field: d.path.join('.'), message: d.message })));
      } else {
        validated[key] = value;
      }
    }

    if (errors.length) {
      return next(ApiError.badRequest('Validation failed', errors));
    }

    res.locals.validated = validated;
    if (validated.body) req.body = validated.body;
    return next();
  };
