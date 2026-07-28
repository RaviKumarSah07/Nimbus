import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

type Source = "body" | "query" | "params";

/**
 * Parses & replaces req[source] with the validated (and coerced/transformed)
 * data. Validation failures fall through to the central error handler as a
 * ZodError, so every route gets identical 400 responses for free.
 */
export function validate(schema: ZodTypeAny, source: Source = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      (req as Record<Source, unknown>)[source] = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}
