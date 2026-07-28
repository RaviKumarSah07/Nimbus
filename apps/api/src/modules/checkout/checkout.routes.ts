import { Router } from "express";
import { checkoutSchema } from "@ecommerce/shared";
import { validate } from "../../middleware/validate";
import { optionalAuthenticate } from "../../middleware/auth";
import { checkoutRateLimiter } from "../../middleware/rateLimiter";
import * as checkoutController from "./checkout.controller";

const router = Router();

router.post("/", optionalAuthenticate, checkoutRateLimiter, validate(checkoutSchema), checkoutController.startCheckout);

export default router;
