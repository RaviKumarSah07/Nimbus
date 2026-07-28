import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@ecommerce/db";
import type { ApiResponse } from "@ecommerce/shared";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import { isProduction } from "../config/env";

// `instanceof` can fail across a bundler/test-runner module boundary even
// when both sides resolve the identical file on disk (a workspace package
// loaded through Vitest's SSR transform vs. a plain `require` is the case
// that bit us here) - so error identity is checked structurally as a
// fallback, not just nominally.
function isZodError(err: unknown): err is ZodError {
  return err instanceof ZodError || (isErrorNamed(err, "ZodError") && Array.isArray((err as { issues?: unknown }).issues));
}

function isPrismaKnownRequestError(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError || (isErrorNamed(err, "PrismaClientKnownRequestError") && typeof (err as { code?: unknown }).code === "string");
}

function isErrorNamed(err: unknown, name: string): boolean {
  return typeof err === "object" && err !== null && (err as { name?: string }).name === name;
}

export function notFoundHandler(req: Request, res: Response) {
  const body: ApiResponse<never> = {
    success: false,
    error: { message: `Route not found: ${req.method} ${req.originalUrl}`, code: "NOT_FOUND" },
  };
  res.status(404).json(body);
}

// Express recognizes error middleware by arity, so `next` must stay even though it's unused.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    const body: ApiResponse<never> = {
      success: false,
      error: { message: err.message, code: err.code, fields: err.fields },
    };
    return res.status(err.statusCode).json(body);
  }

  if (isZodError(err)) {
    const body: ApiResponse<never> = {
      success: false,
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        fields: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      },
    };
    return res.status(400).json(body);
  }

  if (isPrismaKnownRequestError(err)) {
    if (err.code === "P2002") {
      const body: ApiResponse<never> = {
        success: false,
        error: { message: "A record with this value already exists", code: "DUPLICATE" },
      };
      return res.status(409).json(body);
    }
    if (err.code === "P2025") {
      const body: ApiResponse<never> = {
        success: false,
        error: { message: "Resource not found", code: "NOT_FOUND" },
      };
      return res.status(404).json(body);
    }
  }

  logger.error("Unhandled error", {
    message: (err as Error)?.message,
    stack: isProduction ? undefined : (err as Error)?.stack,
    path: req.originalUrl,
    method: req.method,
  });

  const body: ApiResponse<never> = {
    success: false,
    error: { message: isProduction ? "Something went wrong. Please try again." : (err as Error)?.message ?? "Unknown error", code: "INTERNAL" },
  };
  return res.status(500).json(body);
}
