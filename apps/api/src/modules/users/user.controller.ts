import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as authService from "../auth/auth.service";
import * as addressService from "./address.service";

export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user!.id);
  sendSuccess(res, user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user!.id, req.body);
  sendSuccess(res, user);
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user!.id, req.body);
  sendSuccess(res, { message: "Password updated. Please log in again on other devices." });
});

export const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressService.listAddresses(req.user!.id);
  sendSuccess(res, addresses);
});

export const createAddress = asyncHandler(async (req, res) => {
  const address = await addressService.createAddress(req.user!.id, req.body);
  sendSuccess(res, address, 201);
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await addressService.updateAddress(req.user!.id, req.params.addressId, req.body);
  sendSuccess(res, address);
});

export const deleteAddress = asyncHandler(async (req, res) => {
  await addressService.deleteAddress(req.user!.id, req.params.addressId);
  sendSuccess(res, { deleted: true });
});
