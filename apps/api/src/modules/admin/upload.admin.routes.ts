import { Router } from "express";
import * as uploadController from "../uploads/upload.controller";

const router = Router();

router.get("/uploads/config", uploadController.getUploadConfig);
router.post("/uploads/signature", uploadController.getSignature);

export default router;
