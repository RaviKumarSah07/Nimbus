import { Router } from "express";
import { z } from "zod";
import { addCartItemSchema, updateCartItemSchema } from "@ecommerce/shared";
import { validate } from "../../middleware/validate";
import { optionalAuthenticate, authenticate } from "../../middleware/auth";
import * as cartController from "./cart.controller";

const router = Router();

router.use(optionalAuthenticate);

router.get("/", cartController.getCart);
router.post("/items", validate(addCartItemSchema), cartController.addItem);
router.patch("/items/:itemId", validate(updateCartItemSchema), cartController.updateItem);
router.delete("/items/:itemId", cartController.removeItem);

router.post(
  "/merge",
  authenticate,
  validate(z.object({ guestToken: z.string().min(1) })),
  cartController.mergeGuestCart,
);

export default router;
