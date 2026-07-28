import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 15000,
    hookTimeout: 15000,
    // Tests share one real Postgres database and reset it between files -
    // running them in parallel workers would race on that shared state.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
