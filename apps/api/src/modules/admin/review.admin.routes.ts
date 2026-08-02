import { Router } from "express";
import { adminReviewQuerySchema } from "@ecommerce/shared";
import { validate } from "../../middleware/validate";
import * as reviewController from "../reviews/review.controller";

const router = Router();

router.get("/reviews", validate(adminReviewQuerySchema, "query"), reviewController.listAdmin);
router.delete("/reviews/:id", reviewController.removeAdmin);

export default router;
