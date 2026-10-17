import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    // Database tests need a real Postgres: `pnpm test:db` (vitest.db.config.mts).
    exclude: ["node_modules/**", ".next/**", "**/*.db.test.ts"],
  },
});
