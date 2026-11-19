import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import type { UserRole } from '../models/user.model';
import { ApiError } from '../utils/ApiError';

interface AccessPayload extends jwt.JwtPayload {
  sub: string;
  role: UserRole;
}

/**
 * Verifies the short-lived access token from `Authorization: Bearer <token>`.
 * Stateless by design (no DB hit per request); revocation is handled by the
 * short access-token lifetime + server-side refresh-token store.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized());
  }

  try {
    const payload = jwt.verify(header.slice(7), config.jwt.accessSecret) as AccessPayload;
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    const expired = err instanceof jwt.TokenExpiredError;
    return next(ApiError.unauthorized(expired ? 'Access token expired' : 'Invalid access token'));
  }
};

export const authorize =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (roles.length && !roles.includes(req.user.role)) return next(ApiError.forbidden());
    return next();
  };
