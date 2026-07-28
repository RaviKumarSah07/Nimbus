import type { Request, Response } from "express";
import { isProduction } from "../../config/env";

export const REFRESH_COOKIE_NAME = "refresh_token";
// Scoped to /api/auth so the cookie is never sent to unrelated routes.
const REFRESH_COOKIE_PATH = "/api/auth";

export function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    // Cross-site (web on Vercel, API on Render) needs SameSite=None in prod;
    // same-site localhost development is fine with Lax.
    sameSite: isProduction ? "none" : "lax",
    path: REFRESH_COOKIE_PATH,
    expires: expiresAt,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: REFRESH_COOKIE_PATH,
  });
}

export function readRefreshCookie(req: Request): string | undefined {
  return req.cookies?.[REFRESH_COOKIE_NAME];
}
