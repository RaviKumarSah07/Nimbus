import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/users/user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

// Remaining feature routers are mounted here as each module is built.

export default router;
