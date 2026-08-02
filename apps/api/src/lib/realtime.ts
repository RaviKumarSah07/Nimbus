import type { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { verifyAccessToken } from "../modules/auth/jwt";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import type { Role } from "@ecommerce/shared";

const WS_PATH = "/api/ws";

interface Connection {
  ws: WebSocket;
  userId: string;
  role: Role;
}

/**
 * In-memory only - correct for this app's single-instance Render deployment.
 * A multi-instance deployment would need to fan pushes out through Redis
 * pub/sub instead, the same caveat the rate limiter and product-list cache
 * already carry for REDIS_URL being optional rather than required.
 */
const connections = new Set<Connection>();

const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

/**
 * Pushes tiny "these RTK Query tags are now stale" signals, not business
 * data - the REST API stays the single source of truth for what actually
 * changed, and the frontend's existing cache-tag system decides what to
 * refetch. Attached to the same HTTP server Express listens on (not a
 * separate port), so it deploys identically to the rest of the API.
 */
export function attachRealtimeServer(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url ?? "", "http://internal");
    if (url.pathname !== WS_PATH) {
      socket.destroy();
      return;
    }

    // Browsers can't set custom headers on a WebSocket handshake, so the
    // access token travels as a query param instead of an Authorization
    // header - the same short-lived token already used for every REST call,
    // just carried differently for this one connection.
    const origin = req.headers.origin;
    const token = url.searchParams.get("token");

    if ((origin && !allowedOrigins.includes(origin)) || !token) {
      socket.destroy();
      return;
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      const connection: Connection = { ws, userId: payload.sub, role: payload.role };
      connections.add(connection);
      ws.on("close", () => connections.delete(connection));
      ws.on("error", () => connections.delete(connection));
    });
  });

  logger.info(`Realtime WebSocket server attached at ${WS_PATH}`);
}

function send(ws: WebSocket, tags: string[]) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ tags }));
}

/** Pushes to every open connection for one specific user - e.g. their order status changed. */
export function pushToUser(userId: string, tags: string[]) {
  for (const conn of connections) {
    if (conn.userId === userId) send(conn.ws, tags);
  }
}

/** Pushes to every connected admin - e.g. so a second admin's dashboard updates when a customer places an order. */
export function pushToAdmins(tags: string[]) {
  for (const conn of connections) {
    if (conn.role === "ADMIN") send(conn.ws, tags);
  }
}
