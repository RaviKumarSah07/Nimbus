import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import type { RegisterInput, LoginInput, ResetPasswordInput, ChangePasswordInput, UpdateProfileInput } from "@ecommerce/shared";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../utils/logger";
import { notificationService } from "../../lib/notifications";
import { signAccessToken, verifyAccessToken, generateOpaqueToken, hashOpaqueToken } from "./jwt";
import { toPublicUser, type IssuedTokens, type PublicUser, type RequestMeta } from "./auth.types";

const PASSWORD_RESET_TOKEN_TTL_MINUTES = 60;
const BCRYPT_COST = 12;

/**
 * Refresh tokens are single-use, but a browser can legitimately present the
 * same cookie twice at once - e.g. a cold page load restoring the session
 * while an authenticated request 401s and refreshes in parallel. Treating
 * that race as theft would sign the user out of every device, so a replay
 * this soon after rotation is forgiven and simply rotated again. A replay
 * after the window is still treated as a stolen token.
 */
const REFRESH_REUSE_GRACE_MS = 30_000;

async function issueTokens(userId: string, role: PublicUser["role"], meta: RequestMeta): Promise<IssuedTokens> {
  const accessToken = signAccessToken({ sub: userId, role });

  const refreshToken = generateOpaqueToken();
  const refreshTokenExpiresAt = dayjs().add(env.JWT_REFRESH_EXPIRES_IN_DAYS, "day").toDate();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashOpaqueToken(refreshToken),
      expiresAt: refreshTokenExpiresAt,
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });

  return { accessToken, refreshToken, refreshTokenExpiresAt };
}

export async function registerUser(input: RegisterInput, meta: RequestMeta) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, name: input.name },
  });

  logger.info("User registered", { userId: user.id });

  const tokens = await issueTokens(user.id, user.role, meta);
  return { user: toPublicUser(user), ...tokens };
}

export async function loginUser(input: LoginInput, meta: RequestMeta) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Same error for "no such user" and "wrong password" - don't help attackers
  // enumerate registered emails.
  if (!user || user.deletedAt) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  if (!user.isActive) {
    throw ApiError.forbidden("This account has been deactivated");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  logger.info("User logged in", { userId: user.id });

  const tokens = await issueTokens(user.id, user.role, meta);
  return { user: toPublicUser(user), ...tokens };
}

export async function rotateRefreshToken(rawToken: string, meta: RequestMeta) {
  const tokenHash = hashOpaqueToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });

  if (!existing) {
    throw ApiError.unauthorized("Session expired, please log in again");
  }

  if (existing.expiresAt < new Date()) {
    throw ApiError.unauthorized("Session expired, please log in again");
  }

  if (existing.revokedAt) {
    // Only a token retired by rotation can be a benign race. One killed by
    // logout, a password change, or an earlier reuse alarm has no rotatedAt
    // and must always fail, however recently it happened.
    const replayedAfterMs = existing.rotatedAt ? Date.now() - existing.rotatedAt.getTime() : Infinity;

    if (replayedAfterMs > REFRESH_REUSE_GRACE_MS) {
      logger.warn("Refresh token reuse detected - revoking all sessions", { userId: existing.userId });
      await prisma.refreshToken.updateMany({
        where: { userId: existing.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw ApiError.unauthorized("Session expired, please log in again");
    }

    logger.info("Refresh token replayed within the grace window - treating as a client race", { userId: existing.userId });
  }

  if (!existing.user.isActive || existing.user.deletedAt) {
    throw ApiError.forbidden("This account has been deactivated");
  }

  // Keep the original timestamps so repeated replays can't slide the grace
  // window forward indefinitely.
  if (!existing.revokedAt) {
    const now = new Date();
    await prisma.refreshToken.update({ where: { id: existing.id }, data: { revokedAt: now, rotatedAt: now } });
  }

  const tokens = await issueTokens(existing.userId, existing.user.role, meta);
  return { user: toPublicUser(existing.user), ...tokens };
}

export async function revokeRefreshToken(rawToken: string) {
  const tokenHash = hashOpaqueToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always behave the same whether or not the account exists, so the
  // response can't be used to enumerate registered emails.
  if (user && user.isActive && !user.deletedAt) {
    const rawToken = generateOpaqueToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashOpaqueToken(rawToken),
        expiresAt: dayjs().add(PASSWORD_RESET_TOKEN_TTL_MINUTES, "minute").toDate(),
      },
    });

    const resetUrl = `${env.RESET_PASSWORD_URL_BASE}?token=${rawToken}`;
    await notificationService.send({
      to: user.email,
      subject: "Reset your password",
      body: `We received a request to reset your password. This link expires in 1 hour:\n${resetUrl}`,
    });
    logger.info("Password reset requested", { userId: user.id });
  }
}

export async function resetPassword(input: ResetPasswordInput) {
  const tokenHash = hashOpaqueToken(input.token);
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw ApiError.badRequest("This reset link is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    // Force re-authentication everywhere once the password changes.
    prisma.refreshToken.updateMany({
      where: { userId: resetToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  logger.info("Password reset completed", { userId: resetToken.userId });
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const matches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!matches) {
    throw ApiError.badRequest("Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_COST);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return toPublicUser(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
  const user = await prisma.user.update({ where: { id: userId }, data: input });
  return toPublicUser(user);
}

export { verifyAccessToken };
