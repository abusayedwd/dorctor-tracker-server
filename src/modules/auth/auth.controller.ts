import type { CookieOptions, Response } from 'express';
import { config } from '../../config/env';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { authService } from './auth.service';

export const REFRESH_COOKIE = 'refresh_token';

const cookieOptions = (expires?: Date): CookieOptions => ({
  httpOnly: true, // not readable from JS -> safe from XSS token theft
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  path: '/',
  ...(expires && { expires }),
});

const sendSession = (
  res: Response,
  message: string,
  session: Awaited<ReturnType<typeof authService.login>>,
) => {
  res.cookie(REFRESH_COOKIE, session.refreshToken, cookieOptions(session.refreshExpiresAt));
  sendResponse(res, {
    message,
    data: {
      user: session.user.toJSON(),
      accessToken: session.accessToken,
      expiresIn: session.accessTokenExpiresIn,
    },
  });
};

export const login = catchAsync(async (req, res) => {
  const session = await authService.login(req.body.email, req.body.password);
  sendSession(res, 'Signed in successfully', session);
});

export const refresh = catchAsync(async (req, res) => {
  try {
    const session = await authService.refresh(req.cookies?.[REFRESH_COOKIE]);
    sendSession(res, 'Session refreshed', session);
  } catch (err) {
    // Clear a dead cookie so the frontend middleware stops treating the user as signed in.
    res.clearCookie(REFRESH_COOKIE, cookieOptions());
    throw err;
  }
});

export const logout = catchAsync(async (req, res) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE]);
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
  sendResponse(res, { message: 'Signed out', data: null });
});

export const me = catchAsync(async (req, res) => {
  const user = await authService.getProfile(req.user!.id);
  sendResponse(res, { message: 'Current user', data: user });
});
