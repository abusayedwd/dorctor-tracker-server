import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';

export const notFound: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/** Normalises any thrown error into an ApiError. */
const normalise = (err: unknown): ApiError => {
  if (err instanceof ApiError) return err;

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiError.badRequest('Validation failed', details);
  }
  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for "${err.path}"`);
  }
  // Duplicate key (unique index violation)
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue ?? {};
    const field = Object.keys(keyValue)[0] ?? 'field';
    return ApiError.conflict(`A record with this ${field} already exists`);
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return ApiError.badRequest('Malformed JSON body');
  }

  const error = new ApiError(500, 'Internal server error');
  Object.defineProperty(error, 'cause', { value: err });
  return error;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const apiError = normalise(err);

  if (apiError.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    ...(apiError.details !== undefined && { errors: apiError.details }),
    ...(!config.isProd && apiError.statusCode >= 500 && { stack: (err as Error)?.stack }),
  });
};
