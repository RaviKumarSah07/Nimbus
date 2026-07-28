import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/users/user.routes";
import productRoutes from "../modules/catalog/product.routes";
import categoryRoutes from "../modules/catalog/category.routes";
import brandRoutes from "../modules/catalog/brand.routes";
import adminRoutes from "../modules/admin/admin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", brandRoutes);
router.use("/admin", adminRoutes);

// Remaining feature routers are mounted here as each module is built.

export default router;
