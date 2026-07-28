import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import { ApiError } from "../../utils/ApiError";
import * as authService from "./auth.service";
import { setRefreshCookie, clearRefreshCookie, readRefreshCookie } from "./cookies";

function requestMeta(req: Request) {
  return { ip: req.ip, userAgent: req.headers["user-agent"] };
}

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken, refreshTokenExpiresAt } = await authService.registerUser(req.body, requestMeta(req));
  setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
  sendSuccess(res, { user, accessToken }, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken, refreshTokenExpiresAt } = await authService.loginUser(req.body, requestMeta(req));
  setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
  sendSuccess(res, { user, accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = readRefreshCookie(req);
  if (!rawToken) throw ApiError.unauthorized("Session expired, please log in again");

  const { user, accessToken, refreshToken, refreshTokenExpiresAt } = await authService.rotateRefreshToken(rawToken, requestMeta(req));
  setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
  sendSuccess(res, { user, accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = readRefreshCookie(req);
  if (rawToken) await authService.revokeRefreshToken(rawToken);
  clearRefreshCookie(res);
  sendSuccess(res, { loggedOut: true });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);
  sendSuccess(res, user);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.requestPasswordReset(req.body.email);
  sendSuccess(res, { message: "If that email is registered, a reset link has been sent." });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body);
  sendSuccess(res, { message: "Password has been reset. You can now log in." });
});
