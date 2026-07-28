import { createApp } from "./app";
import { env } from "./config/env";
import { connectRedis } from "./lib/redis";
import { prisma } from "./lib/prisma";
import { logger } from "./utils/logger";

async function main() {
  await connectRedis();
  await prisma.$connect();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT}`, { env: env.NODE_ENV });
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error("Fatal startup error", { error: (err as Error).message });
  process.exit(1);
});
