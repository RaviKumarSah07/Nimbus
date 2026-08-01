import { Router } from "express";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@ecommerce/shared";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { authRateLimiter, refreshRateLimiter } from "../../middleware/rateLimiter";
import * as authController from "./auth.controller";

const router = Router();

router.post("/register", authRateLimiter, validate(registerSchema), authController.register);
router.post("/login", authRateLimiter, validate(loginSchema), authController.login);
router.post("/refresh", refreshRateLimiter, authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);
router.post("/forgot-password", authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);

export default router;
