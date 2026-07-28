import { Router } from "express";
import { validateCouponSchema } from "@ecommerce/shared";
import { validate as validateBody } from "../../middleware/validate";
import * as couponController from "./coupon.controller";

const router = Router();

router.post("/validate", validateBody(validateCouponSchema), couponController.validate);

export default router;
