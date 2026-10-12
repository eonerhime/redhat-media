import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// `pnpm test:db`: the *.db.test.ts files against a real Postgres, reached
// through the TEST_*_DATABASE_URL variables (lib/db/test-client.ts).
// Standalone rather than merged: mergeConfig would concatenate the unit
// config's include/exclude lists.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["**/*.db.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    // One file at a time: the tests share one database.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
