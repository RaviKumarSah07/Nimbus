import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as categoryService from "./category.service";

export const tree = asyncHandler(async (_req, res) => {
  const categories = await categoryService.getCategoryTree();
  sendSuccess(res, categories);
});

export const bySlug = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  sendSuccess(res, category);
});

export const listAdmin = asyncHandler(async (_req, res) => {
  const categories = await categoryService.listCategoriesAdmin();
  sendSuccess(res, categories);
});

export const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body, req.user!.id);
  sendSuccess(res, category, 201);
});

export const update = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body, req.user!.id);
  sendSuccess(res, category);
});

export const remove = asyncHandler(async (req, res) => {
  await categoryService.softDeleteCategory(req.params.id, req.user!.id);
  sendSuccess(res, { deleted: true });
});
