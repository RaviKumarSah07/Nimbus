import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env, isProduction } from "./config/env";
import apiRouter from "./routes";
import { stripeWebhookRouter } from "./modules/webhooks/webhook.routes";
import { generalApiRateLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(
    compression({
      // compression buffers output to build its window, which breaks a
      // streamed SSE connection - each event needs to reach the client as
      // it's written, not once enough of them have accumulated to compress.
      filter: (req, res) => (req.path === "/api/events" ? false : compression.filter(req, res)),
    }),
  );
  app.use(morgan(isProduction ? "combined" : "dev", { skip: () => env.NODE_ENV === "test" }));

  // Stripe requires the raw, unparsed request body to verify webhook
  // signatures, so this route is mounted before the JSON body parser and
  // is exempt from it.
  app.use("/api/webhooks", stripeWebhookRouter);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.use("/api", generalApiRateLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
