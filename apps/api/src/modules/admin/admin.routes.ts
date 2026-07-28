import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth";
import catalogAdminRoutes from "./catalog.admin.routes";
import contentAdminRoutes from "./content.admin.routes";
import couponAdminRoutes from "./coupon.admin.routes";
import orderAdminRoutes from "./order.admin.routes";

const router = Router();

// Every route under /api/admin requires a logged-in admin - enforced once
// here rather than repeated per-route, so a new admin route can never
// accidentally ship unprotected.
router.use(authenticate, requireRole("ADMIN"));

router.use("/", catalogAdminRoutes);
router.use("/", contentAdminRoutes);
router.use("/", couponAdminRoutes);
router.use("/", orderAdminRoutes);

export default router;
