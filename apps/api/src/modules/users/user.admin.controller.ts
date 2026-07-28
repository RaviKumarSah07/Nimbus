import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as userAdminService from "./user.admin.service";

export const listAdmin = asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await userAdminService.listUsersAdmin(page, limit);
  sendSuccess(res, result);
});

export const updateRole = asyncHandler(async (req, res) => {
  const user = await userAdminService.updateUserRole(req.params.id, req.body.role, req.user!.id);
  sendSuccess(res, user);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const user = await userAdminService.updateUserStatus(req.params.id, req.body.isActive, req.user!.id);
  sendSuccess(res, user);
});
