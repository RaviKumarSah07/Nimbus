import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as dashboardService from "./dashboard.service";

export const getStats = asyncHandler(async (_req, res) => {
  const stats = await dashboardService.getDashboardStats();
  sendSuccess(res, stats);
});
