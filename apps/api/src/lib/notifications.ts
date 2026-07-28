import { logger } from "../utils/logger";

export interface Notification {
  to: string;
  subject: string;
  body: string;
}

export interface NotificationProvider {
  send(notification: Notification): Promise<void>;
}

/**
 * Default provider: logs the notification instead of sending real email.
 * Swap this for an SMTP/SendGrid/SES provider by implementing
 * NotificationProvider and changing the export below - every call site
 * (password reset, order confirmation, shipping updates) is already
 * written against this interface, not a concrete transport.
 */
class ConsoleNotificationProvider implements NotificationProvider {
  async send(notification: Notification): Promise<void> {
    logger.info("Notification (console provider - no SMTP configured)", { ...notification });
  }
}

export const notificationService: NotificationProvider = new ConsoleNotificationProvider();
