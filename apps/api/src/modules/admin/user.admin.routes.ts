import { Router } from "express";
import { updateUserRoleSchema, updateUserStatusSchema } from "@ecommerce/shared";
import { validate } from "../../middleware/validate";
import * as userAdminController from "../users/user.admin.controller";

const router = Router();

router.get("/users", userAdminController.listAdmin);
router.patch("/users/:id/role", validate(updateUserRoleSchema), userAdminController.updateRole);
router.patch("/users/:id/status", validate(updateUserStatusSchema), userAdminController.updateStatus);

export default router;
