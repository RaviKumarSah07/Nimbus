import { Router } from "express";
import * as categoryController from "./category.controller";

const router = Router();

router.get("/", categoryController.tree);
router.get("/:slug", categoryController.bySlug);

export default router;
