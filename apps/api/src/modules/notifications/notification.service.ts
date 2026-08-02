import type { NotificationType } from "@ecommerce/shared";
import { prisma } from "../../lib/prisma";
import { buildPaginatedResult } from "../../utils/response";
import { notificationService as emailHook } from "../../lib/notifications";
import { pushToUser, pushToAdmins } from "../../lib/realtime";
import { logger } from "../../utils/logger";

interface CreateNotificationParams {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  /**
   * Extra RTK Query cache tags to invalidate on the recipient's connected
   * clients, beyond "Notification" (always pushed). The caller already
   * knows what changed - e.g. order.service passes ["Order", "Cart"] for a
   * just-paid order - so this stays a plain pass-through rather than a
   * NotificationType -> tags table that would have to special-case the same
   * type meaning different things to notifyUser vs notifyAdmins callers.
   */
  tags?: string[];
}

/**
 * Every order event writes an in-app row (what the bell UI reads), pushes a
 * realtime cache-invalidation signal to any of that user's open connections,
 * and, best effort, goes through the same NotificationProvider interface
 * auth already uses for password resets - so swapping in a real email/SMS
 * provider later lights up order events too, not just auth ones. The in-app
 * row is the source of truth; a provider failure is logged and swallowed
 * rather than failing the order action that triggered it.
 */
export async function notifyUser(params: CreateNotificationParams) {
  const { tags, ...notificationFields } = params;
  const notification = await prisma.notification.create({ data: notificationFields });

  pushToUser(params.recipientId, ["Notification", ...(tags ?? [])]);

  const recipient = await prisma.user.findUnique({ where: { id: params.recipientId }, select: { email: true } });
  if (recipient) {
    emailHook.send({ to: recipient.email, subject: params.title, body: params.message }).catch((err) => {
      logger.warn("Notification email hook failed", { error: (err as Error).message });
    });
  }

  return notification;
}

/** Fans out to every admin account - a small, fixed set in this app, so one row per admin is simpler and cheaper to query than a broadcast/read-receipt table. */
export async function notifyAdmins(params: Omit<CreateNotificationParams, "recipientId">) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", deletedAt: null }, select: { id: true, email: true } });
  const { tags, ...notificationFields } = params;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({ ...notificationFields, recipientId: admin.id })),
  });

  pushToAdmins(["Notification", ...(tags ?? [])]);

  for (const admin of admins) {
    emailHook.send({ to: admin.email, subject: params.title, body: params.message }).catch((err) => {
      logger.warn("Notification email hook failed", { error: (err as Error).message });
    });
  }
}

export async function listForUser(userId: string, page: number, limit: number) {
  const [rows, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where: { recipientId: userId } }),
    prisma.notification.count({ where: { recipientId: userId, isRead: false } }),
  ]);
  return { ...buildPaginatedResult(rows, total, page, limit), unreadCount };
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { recipientId: userId, isRead: false } });
}

/** Scoped to the owning user in the WHERE clause, not just looked up by id, so one user can never mark another's notification read by guessing an id. */
export async function markRead(userId: string, notificationId: string) {
  await prisma.notification.updateMany({ where: { id: notificationId, recipientId: userId }, data: { isRead: true } });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { recipientId: userId, isRead: false }, data: { isRead: true } });
}
