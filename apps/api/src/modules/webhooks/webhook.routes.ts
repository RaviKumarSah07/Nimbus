import { Router } from "express";

// Stripe webhook handling is wired up in the checkout/payments milestone.
// Kept as its own router (mounted before express.json() in app.ts) because
// Stripe signature verification needs the raw request body.
export const stripeWebhookRouter = Router();
