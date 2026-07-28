import { Router } from "express";
import { updateOrderStatusSchema } from "@ecommerce/shared";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import * as orderController from "../orders/order.controller";

const router = Router();

router.get("/orders", orderController.listAdmin);
router.get("/orders/:id", orderController.getAdmin);
router.patch("/orders/:id/status", validate(updateOrderStatusSchema), orderController.updateStatusAdmin);

router.get("/returns", orderController.listReturnsAdmin);
router.patch(
  "/returns/:id",
  validate(z.object({ status: z.enum(["APPROVED", "REJECTED", "COMPLETED"]) })),
  orderController.updateReturnStatusAdmin,
);

export default router;
