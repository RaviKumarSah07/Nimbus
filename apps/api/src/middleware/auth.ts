import type { NextFunction, Request, Response } from "express";
import type { Role } from "@ecommerce/shared";
import { verifyAccessToken } from "../modules/auth/jwt";
import { ApiError } from "../utils/ApiError";

function extractBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
}

/** Requires a valid access token. Attaches { id, role } to req.user. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) return next(ApiError.unauthorized());

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized("Session expired, please log in again"));
  }
}

/** Attaches req.user if a valid token is present, otherwise continues as a guest. */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      // Invalid/expired token on an optional route just means "treat as guest".
    }
  }
  next();
}

/** Must run after `authenticate`. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}
