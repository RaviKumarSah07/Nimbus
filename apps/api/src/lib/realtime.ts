import type { Response } from "express";
import type { Role } from "@ecommerce/shared";

interface Connection {
  res: Response;
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

/** Called by the SSE route handler once a connection is authenticated. Returns an unregister function for its close handler. */
export function registerConnection(res: Response, userId: string, role: Role): () => void {
  const connection: Connection = { res, userId, role };
  connections.add(connection);
  return () => connections.delete(connection);
}

function send(res: Response, tags: string[]) {
  if (!res.writableEnded) res.write(`data: ${JSON.stringify({ tags })}\n\n`);
}

/** Pushes to every open connection for one specific user - e.g. their order status changed. */
export function pushToUser(userId: string, tags: string[]) {
  for (const conn of connections) {
    if (conn.userId === userId) send(conn.res, tags);
  }
}

/** Pushes to every connected admin - e.g. so a second admin's dashboard updates when a customer places an order. */
export function pushToAdmins(tags: string[]) {
  for (const conn of connections) {
    if (conn.role === "ADMIN") send(conn.res, tags);
  }
}
