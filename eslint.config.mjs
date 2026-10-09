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
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "lib/generated/**"]),
]);

export default eslintConfig;
