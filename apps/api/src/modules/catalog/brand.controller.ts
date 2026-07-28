import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as brandService from "./brand.service";

export const list = asyncHandler(async (_req, res) => {
  const brands = await brandService.listBrands();
  sendSuccess(res, brands);
});

export const create = asyncHandler(async (req, res) => {
  const brand = await brandService.createBrand(req.body.name, req.body.slug, req.user!.id);
  sendSuccess(res, brand, 201);
});

export const remove = asyncHandler(async (req, res) => {
  await brandService.deleteBrand(req.params.id, req.user!.id);
  sendSuccess(res, { deleted: true });
});
