import { Router } from "express";
import { cancelOrderSchema, returnRequestSchema } from "@ecommerce/shared";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import * as orderController from "./order.controller";

const router = Router();

// Unguessable-id "receipt" route - intentionally public, see order.service.getOrderConfirmation.
router.get("/confirmation/:id", orderController.getConfirmation);

router.use(authenticate);

router.get("/", orderController.listMine);
router.get("/:id", orderController.getMine);
router.post("/:id/cancel", validate(cancelOrderSchema), orderController.cancel);
router.post("/:id/return", validate(returnRequestSchema), orderController.requestReturn);

export default router;
