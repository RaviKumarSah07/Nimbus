import { Router } from "express";
import { createReviewSchema } from "@ecommerce/shared";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import * as reviewController from "./review.controller";

const router = Router();

router.get("/product/:productId", reviewController.listForProduct);
router.post("/product/:productId", authenticate, validate(createReviewSchema), reviewController.create);

export default router;
