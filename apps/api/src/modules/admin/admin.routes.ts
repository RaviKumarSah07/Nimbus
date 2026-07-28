import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth";
import catalogAdminRoutes from "./catalog.admin.routes";

const router = Router();

// Every route under /api/admin requires a logged-in admin - enforced once
// here rather than repeated per-route, so a new admin route can never
// accidentally ship unprotected.
router.use(authenticate, requireRole("ADMIN"));

router.use("/", catalogAdminRoutes);

export default router;
