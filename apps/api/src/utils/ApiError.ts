export interface ApiFieldError {
  path: string;
  message: string;
}

/**
 * Thrown deliberately anywhere in the request lifecycle. The central error
 * handler (middleware/errorHandler.ts) knows how to serialize this into the
 * shared ApiResponse envelope; anything else is treated as an unexpected
 * 500 and its details are never leaked to the client.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly fields?: ApiFieldError[];

  constructor(statusCode: number, message: string, options?: { code?: string; fields?: ApiFieldError[] }) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = options?.code;
    this.fields = options?.fields;
  }

  static badRequest(message: string, fields?: ApiFieldError[]) {
    return new ApiError(400, message, { code: "BAD_REQUEST", fields });
  }

  static unauthorized(message = "Authentication required") {
    return new ApiError(401, message, { code: "UNAUTHORIZED" });
  }

  static forbidden(message = "You do not have permission to perform this action") {
    return new ApiError(403, message, { code: "FORBIDDEN" });
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message, { code: "NOT_FOUND" });
  }

  static conflict(message: string) {
    return new ApiError(409, message, { code: "CONFLICT" });
  }

  static tooManyRequests(message = "Too many requests, please slow down") {
    return new ApiError(429, message, { code: "RATE_LIMITED" });
  }

  static internal(message = "Something went wrong") {
    return new ApiError(500, message, { code: "INTERNAL" });
  }
}
