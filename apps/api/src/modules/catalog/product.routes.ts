import { Router } from "express";
import { productQuerySchema } from "@ecommerce/shared";
import { validate } from "../../middleware/validate";
import * as productController from "./product.controller";

const router = Router();

router.get("/", validate(productQuerySchema, "query"), productController.list);
router.get("/by-ids", productController.byIds);
router.get("/:slug", productController.detail);
router.get("/:slug/related", productController.related);

export default router;
