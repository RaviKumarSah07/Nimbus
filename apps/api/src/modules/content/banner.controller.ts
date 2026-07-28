import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as bannerService from "./banner.service";

export const list = asyncHandler(async (_req, res) => {
  const banners = await bannerService.listActiveBanners();
  sendSuccess(res, banners);
});

export const listAdmin = asyncHandler(async (_req, res) => {
  const banners = await bannerService.listBannersAdmin();
  sendSuccess(res, banners);
});

export const create = asyncHandler(async (req, res) => {
  const banner = await bannerService.createBanner(req.body, req.user!.id);
  sendSuccess(res, banner, 201);
});

export const update = asyncHandler(async (req, res) => {
  const banner = await bannerService.updateBanner(req.params.id, req.body, req.user!.id);
  sendSuccess(res, banner);
});

export const remove = asyncHandler(async (req, res) => {
  await bannerService.deleteBanner(req.params.id, req.user!.id);
  sendSuccess(res, { deleted: true });
});
