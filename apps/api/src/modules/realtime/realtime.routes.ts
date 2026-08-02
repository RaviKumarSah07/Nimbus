import { Router } from "express";
import { verifyAccessToken } from "../auth/jwt";
import { registerConnection } from "../../lib/realtime";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";

const router = Router();

const KEEPALIVE_INTERVAL_MS = 25_000;

/**
 * Server-Sent Events, not WebSocket: a plain long-lived HTTP response
 * (chunked, text/event-stream), not a protocol Upgrade. Chosen specifically
 * because it survives budget/shared reverse proxies - this app's Render free
 * tier included - far more reliably than a WebSocket handshake does. The
 * WebSocket version of this worked perfectly against the same server
 * locally but 502'd through Render's edge in production; this endpoint is
 * ordinary HTTP the whole way, which those same proxies handle routinely.
 *
 * EventSource can't set custom headers, so the token travels as a query
 * param instead of an Authorization header - the same short-lived token
 * already used for every other request, just carried differently here.
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : undefined;
    if (!token) throw ApiError.unauthorized();

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized("Session expired, please log in again");
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Several shared/free-tier proxies buffer responses unless told not
      // to - harmless to send even where it isn't honored.
      "X-Accel-Buffering": "no",
    });
    res.write("retry: 3000\n\n");

    const unregister = registerConnection(res, payload.sub, payload.role);

    // Keeps the connection alive through any intermediary that times out an
    // idle stream - a comment line, ignored by EventSource's onmessage but
    // enough traffic to look active to a proxy in between.
    const keepalive = setInterval(() => {
      if (!res.writableEnded) res.write(": keepalive\n\n");
    }, KEEPALIVE_INTERVAL_MS);

    req.on("close", () => {
      clearInterval(keepalive);
      unregister();
    });
  }),
);

export default router;
