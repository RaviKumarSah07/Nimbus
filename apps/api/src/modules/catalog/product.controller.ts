import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import { ApiError } from "../../utils/ApiError";
import * as productService from "./product.service";

export const list = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query as never);
  sendSuccess(res, result);
});

export const detail = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);
  sendSuccess(res, product);
});

export const related = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);
  const items = await productService.getRelatedProducts(product.id);
  sendSuccess(res, items);
});

export const byIds = asyncHandler(async (req, res) => {
  const raw = String(req.query.ids ?? "");
  const ids = raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const items = await productService.getProductsByIds(ids);
  sendSuccess(res, items);
});

export const listAdmin = asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await productService.listProductsAdmin(page, limit);
  sendSuccess(res, result);
});

export const create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.user!.id);
  sendSuccess(res, product, 201);
});

export const update = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.user!.id);
  sendSuccess(res, product);
});

export const remove = asyncHandler(async (req, res) => {
  if (!req.params.id) throw ApiError.badRequest("Product id is required");
  await productService.softDeleteProduct(req.params.id, req.user!.id);
  sendSuccess(res, { deleted: true });
});
