import { Router } from "express";
import * as brandController from "./brand.controller";

const router = Router();

router.get("/", brandController.list);

export default router;
