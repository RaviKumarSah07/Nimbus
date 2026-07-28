import { Router } from "express";
import { createCouponSchema, updateCouponSchema } from "@ecommerce/shared";
import { validate } from "../../middleware/validate";
import * as couponController from "../coupons/coupon.controller";

const router = Router();

router.get("/coupons", couponController.listAdmin);
router.post("/coupons", validate(createCouponSchema), couponController.create);
router.patch("/coupons/:id", validate(updateCouponSchema), couponController.update);
router.delete("/coupons/:id", couponController.remove);

export default router;
