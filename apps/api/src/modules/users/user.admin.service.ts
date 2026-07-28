import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { recordAudit } from "../../utils/audit";
import { buildPaginatedResult } from "../../utils/response";
import type { Role } from "@ecommerce/shared";

export async function listUsersAdmin(page: number, limit: number) {
  const where = { deletedAt: null };
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, _count: { select: { orders: true } } },
    }),
    prisma.user.count({ where }),
  ]);
  return buildPaginatedResult(rows, total, page, limit);
}

export async function updateUserRole(userId: string, role: Role, actorUserId: string) {
  if (userId === actorUserId) throw ApiError.badRequest("You can't change your own role");
  const user = await prisma.user.update({ where: { id: userId }, data: { role } });
  await recordAudit({ actorUserId, action: "user.role_update", entityType: "User", entityId: userId, metadata: { role } });
  return user;
}

export async function updateUserStatus(userId: string, isActive: boolean, actorUserId: string) {
  if (userId === actorUserId) throw ApiError.badRequest("You can't deactivate your own account");
  const user = await prisma.user.update({ where: { id: userId }, data: { isActive } });
  if (!isActive) {
    // Deactivating an account also revokes any live sessions immediately.
    await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  await recordAudit({ actorUserId, action: "user.status_update", entityType: "User", entityId: userId, metadata: { isActive } });
  return user;
}
