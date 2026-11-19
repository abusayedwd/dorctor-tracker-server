import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { RefreshToken } from '../../models/refreshToken.model';
import { User, type UserDocument } from '../../models/user.model';
import { ApiError } from '../../utils/ApiError';

const DAY_MS = 24 * 60 * 60 * 1000;

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const signAccessToken = (user: UserDocument) =>
  jwt.sign({ role: user.role }, config.jwt.accessSecret, {
    subject: user.id,
    expiresIn: `${config.jwt.accessExpiresMinutes}m`,
  });

const issueTokens = async (user: UserDocument) => {
  const refreshToken = jwt.sign({}, config.jwt.refreshSecret, {
    subject: user.id,
    jwtid: crypto.randomUUID(),
    expiresIn: `${config.jwt.refreshExpiresDays}d`,
  });
  const refreshExpiresAt = new Date(Date.now() + config.jwt.refreshExpiresDays * DAY_MS);

  await RefreshToken.create({ user: user._id, tokenHash: hashToken(refreshToken), expiresAt: refreshExpiresAt });

  return {
    accessToken: signAccessToken(user),
    accessTokenExpiresIn: config.jwt.accessExpiresMinutes * 60,
    refreshToken,
    refreshExpiresAt,
  };
};

const login = async (email: string, password: string) => {
  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password -> no account enumeration.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  user.lastLoginAt = new Date();
  await user.save();
  return { user, ...(await issueTokens(user)) };
};

/**
 * Refresh-token rotation: each refresh token is single use. It is deleted
 * atomically and a new pair is issued, so a stolen token is useful at most once.
 */
const refresh = async (rawToken: string | undefined) => {
  if (!rawToken) throw ApiError.unauthorized('No active session');

  let userId: string;
  try {
    userId = (jwt.verify(rawToken, config.jwt.refreshSecret) as jwt.JwtPayload).sub as string;
  } catch {
    throw ApiError.unauthorized('Session expired, please sign in again');
  }

  const stored = await RefreshToken.findOneAndDelete({ tokenHash: hashToken(rawToken), user: userId });
  if (!stored) throw ApiError.unauthorized('Session expired, please sign in again');

  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized('Account no longer exists');

  return { user, ...(await issueTokens(user)) };
};

const logout = async (rawToken: string | undefined) => {
  if (rawToken) await RefreshToken.deleteOne({ tokenHash: hashToken(rawToken) });
};

const getProfile = async (userId: string) => {
  const user = await User.findById(userId).lean();
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

export const authService = { login, refresh, logout, getProfile };
