import { prisma } from "../lib/prisma";
import { logger } from "./logger";

interface RecordAuditParams {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget audit trail for admin mutations (product/order/user/coupon
 * changes). Never allowed to throw into the request path - an audit-log
 * failure must not block the underlying business action.
 */
export async function recordAudit(params: RecordAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata as never,
      },
    });
  } catch (err) {
    logger.error("Failed to write audit log", { error: (err as Error).message, ...params });
  }
}
