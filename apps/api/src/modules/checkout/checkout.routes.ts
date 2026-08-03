import { Router } from "express";
import { checkoutSchema, confirmCheckoutSchema } from "@ecommerce/shared";
import { validate } from "../../middleware/validate";
import { optionalAuthenticate } from "../../middleware/auth";
import { checkoutRateLimiter } from "../../middleware/rateLimiter";
import * as checkoutController from "./checkout.controller";

const router = Router();

router.post("/", optionalAuthenticate, checkoutRateLimiter, validate(checkoutSchema), checkoutController.startCheckout);

// Deliberately not behind requireAuth: guests check out too, and the order id
// is already the unguessable capability that gates the confirmation page.
// Nothing here is taken on trust - payment is verified with Stripe directly.
router.post("/confirm", optionalAuthenticate, validate(confirmCheckoutSchema), checkoutController.confirmCheckout);

export default router;
