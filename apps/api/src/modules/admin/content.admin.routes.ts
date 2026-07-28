import { Router } from "express";
import { createBannerSchema, updateBannerSchema } from "@ecommerce/shared";
import { validate } from "../../middleware/validate";
import * as bannerController from "../content/banner.controller";

const router = Router();

router.get("/banners", bannerController.listAdmin);
router.post("/banners", validate(createBannerSchema), bannerController.create);
router.patch("/banners/:id", validate(updateBannerSchema), bannerController.update);
router.delete("/banners/:id", bannerController.remove);

export default router;
