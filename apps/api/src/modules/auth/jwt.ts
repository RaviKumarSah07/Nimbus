import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import type { Role } from "@ecommerce/shared";
import { env } from "../../config/env";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

/** Short-lived, stateless - verified on every request without a DB round trip. */
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

/**
 * Refresh tokens are deliberately NOT JWTs. They're opaque random strings
 * stored hashed in RefreshToken rows, which is what makes rotation and
 * server-side revocation (logout, password reset, reuse detection) possible
 * without maintaining a JWT blocklist.
 */
export function generateOpaqueToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export function hashOpaqueToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
