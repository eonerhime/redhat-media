import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const rawUnsafe =
  "Use Prisma's tagged $queryRaw / $executeRaw templates instead (specs/tech-stack.md).";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // React escapes output; raw HTML injection is banned (specs/tech-stack.md).
      "react/no-danger": "error",
      "no-restricted-properties": [
        "error",
        { property: "$queryRawUnsafe", message: rawUnsafe },
        { property: "$executeRawUnsafe", message: rawUnsafe },
      ],
    },
  },
  {
    // Pages read copy through block() and services through visibleServices() / visiblePillars()
    // (tech-stack.md → Architectural rules 3; Phase 3 spec, D7).
    files: ["app/**", "components/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/content/defaults"],
              message: "Read copy through block() from @/lib/content/block.",
            },
            {
              group: ["**/content/services"],
              importNames: ["services"],
              allowTypeImports: true,
              message: "Read services through visibleServices() / visiblePillars().",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "lib/generated/**"]),
]);

export default eslintConfig;
