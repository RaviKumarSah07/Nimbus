import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as uploadService from "./upload.service";

export const getUploadConfig = asyncHandler(async (_req, res) => {
  sendSuccess(res, { enabled: uploadService.isCloudinaryConfigured });
});

export const getSignature = asyncHandler(async (_req, res) => {
  const signature = uploadService.createUploadSignature();
  sendSuccess(res, signature);
});
