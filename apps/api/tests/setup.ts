// Executed before any test file imports the app, so config/env.ts (which
// runs `import "dotenv/config"` on module load) sees these values first -
// dotenv never overwrites a key that's already set on process.env.
process.env.NODE_ENV = "test";
process.env.PORT = process.env.PORT ?? "4001";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://ecommerce:ecommerce@localhost:5433/ecommerce_test_db?schema=public";
process.env.JWT_ACCESS_SECRET = "test-only-access-secret-not-a-real-secret";
process.env.JWT_REFRESH_SECRET = "test-only-refresh-secret-not-a-real-secret";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN_DAYS = "30";
process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.STRIPE_SUCCESS_URL = "http://localhost:3000/checkout/success";
process.env.STRIPE_CANCEL_URL = "http://localhost:3000/checkout/cancel";
process.env.EMAIL_FROM = "test@example.com";
process.env.RESET_PASSWORD_URL_BASE = "http://localhost:3000/reset-password";
// REDIS_URL intentionally left unset - caching/rate-limit-store code must
// degrade gracefully without it, and the test suite is one more proof of that.
