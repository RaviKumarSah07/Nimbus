import type { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Wraps an async route handler so rejected promises reach the error middleware instead of hanging the request. */
export const asyncHandler =
  (handler: AsyncRouteHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
