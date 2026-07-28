import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/users/user.routes";
import productRoutes from "../modules/catalog/product.routes";
import categoryRoutes from "../modules/catalog/category.routes";
import brandRoutes from "../modules/catalog/brand.routes";
import bannerRoutes from "../modules/content/banner.routes";
import cartRoutes from "../modules/cart/cart.routes";
import couponRoutes from "../modules/coupons/coupon.routes";
import checkoutRoutes from "../modules/checkout/checkout.routes";
import orderRoutes from "../modules/orders/order.routes";
import reviewRoutes from "../modules/reviews/review.routes";
import wishlistRoutes from "../modules/wishlist/wishlist.routes";
import adminRoutes from "../modules/admin/admin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", brandRoutes);
router.use("/banners", bannerRoutes);
router.use("/cart", cartRoutes);
router.use("/coupons", couponRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/orders", orderRoutes);
router.use("/reviews", reviewRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/admin", adminRoutes);

// Remaining feature routers are mounted here as each module is built.

export default router;
