import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as notificationService from "./notification.service";

export const list = asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await notificationService.listForUser(req.user!.id, page, limit);
  sendSuccess(res, result);
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user!.id);
  sendSuccess(res, { count });
});

export const markRead = asyncHandler(async (req, res) => {
  await notificationService.markRead(req.user!.id, req.params.id);
  sendSuccess(res, { ok: true });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user!.id);
  sendSuccess(res, { ok: true });
});
