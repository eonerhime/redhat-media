import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // `server-only` throws outside a react-server build; tests import server modules directly.
      "server-only": fileURLToPath(
        new URL("node_modules/next/dist/compiled/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.ts"],
    // Database tests need a real Postgres: `pnpm test:db` (vitest.db.config.mts).
    exclude: ["node_modules/**", ".next/**", "**/*.db.test.ts"],
  },
});
