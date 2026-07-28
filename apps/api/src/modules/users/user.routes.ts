import { Router } from "express";
import { updateProfileSchema, changePasswordSchema, addressSchema } from "@ecommerce/shared";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import * as userController from "./user.controller";

const router = Router();

router.use(authenticate);

router.get("/me", userController.getProfile);
router.patch("/me", validate(updateProfileSchema), userController.updateProfile);
router.post("/me/change-password", validate(changePasswordSchema), userController.changePassword);

router.get("/me/addresses", userController.listAddresses);
router.post("/me/addresses", validate(addressSchema), userController.createAddress);
router.patch("/me/addresses/:addressId", validate(addressSchema.partial()), userController.updateAddress);
router.delete("/me/addresses/:addressId", userController.deleteAddress);

export default router;
