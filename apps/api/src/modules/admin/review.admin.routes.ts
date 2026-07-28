import { Router } from "express";
import * as reviewController from "../reviews/review.controller";

const router = Router();

router.delete("/reviews/:id", reviewController.removeAdmin);

export default router;
