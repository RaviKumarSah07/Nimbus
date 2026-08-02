import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import * as notificationController from "./notification.controller";

const router = Router();

router.use(authenticate);

router.get("/", notificationController.list);
router.get("/unread-count", notificationController.unreadCount);
router.patch("/:id/read", notificationController.markRead);
router.patch("/read-all", notificationController.markAllRead);

export default router;
