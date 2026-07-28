import { Router } from "express";
import { z } from "zod";
import { createProductSchema, updateProductSchema, createCategorySchema, updateCategorySchema } from "@ecommerce/shared";
import { validate } from "../../middleware/validate";
import * as productController from "../catalog/product.controller";
import * as categoryController from "../catalog/category.controller";
import * as brandController from "../catalog/brand.controller";

const router = Router();

const createBrandSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, hyphen-separated"),
});

router.get("/products", productController.listAdmin);
router.post("/products", validate(createProductSchema), productController.create);
router.patch("/products/:id", validate(updateProductSchema), productController.update);
router.delete("/products/:id", productController.remove);

router.get("/categories", categoryController.listAdmin);
router.post("/categories", validate(createCategorySchema), categoryController.create);
router.patch("/categories/:id", validate(updateCategorySchema), categoryController.update);
router.delete("/categories/:id", categoryController.remove);

router.get("/brands", brandController.list);
router.post("/brands", validate(createBrandSchema), brandController.create);
router.delete("/brands/:id", brandController.remove);

export default router;
