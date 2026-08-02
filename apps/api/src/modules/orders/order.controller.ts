import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as orderService from "./order.service";

export const listMine = asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  const result = await orderService.listMyOrders(req.user!.id, page, limit);
  sendSuccess(res, result);
});

export const getMine = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderForUser(req.user!.id, req.params.id);
  sendSuccess(res, order);
});

export const getConfirmation = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderConfirmation(req.params.id);
  sendSuccess(res, order);
});

export const cancel = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.user!.id, req.params.id, req.body.reason);
  sendSuccess(res, order);
});

export const requestReturn = asyncHandler(async (req, res) => {
  const returnRequest = await orderService.requestReturn(req.user!.id, req.params.id, req.body.orderItemId, req.body.reason);
  sendSuccess(res, returnRequest, 201);
});

// ---------- Admin ----------

export const listAdmin = asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const status = req.query.status as never;
  const result = await orderService.listOrdersAdmin(page, limit, status);
  sendSuccess(res, result);
});

export const getAdmin = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderAdmin(req.params.id);
  sendSuccess(res, order);
});

export const updateStatusAdmin = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatusAdmin(
    req.params.id,
    req.body.status,
    req.body.note,
    req.user!.id,
    req.body.trackingNumber,
    req.body.courier,
  );
  sendSuccess(res, order);
});

export const listReturnsAdmin = asyncHandler(async (_req, res) => {
  const returns = await orderService.listReturnRequestsAdmin();
  sendSuccess(res, returns);
});

export const updateReturnStatusAdmin = asyncHandler(async (req, res) => {
  const returnRequest = await orderService.updateReturnRequestStatusAdmin(req.params.id, req.body.status, req.user!.id);
  sendSuccess(res, returnRequest);
});
