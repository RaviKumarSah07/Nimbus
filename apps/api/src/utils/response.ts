import type { Response } from "express";
import type { ApiResponse, PaginatedResult, PaginationMeta } from "@ecommerce/shared";

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  const body: ApiResponse<T> = { success: true, data };
  return res.status(statusCode).json(body);
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function buildPaginatedResult<T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  return { items, meta: buildPaginationMeta(total, page, limit) };
}
