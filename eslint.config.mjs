import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const rawUnsafe =
  "Use Prisma's tagged $queryRaw / $executeRaw templates instead (specs/tech-stack.md).";

// Images go through <MediaImage>, which checks the public ID and adds the blur
// placeholder (Phase 8 spec, D10).
const cloudinaryImport = {
  group: ["next-cloudinary", "next-cloudinary/*"],
  message: "Render images through <MediaImage> from @/components/media/media-image.",
};

// The server SDK holds the API secret: local scripts only until Phase 28
// (Phase 9 spec, D6). A path, not a pattern: "cloudinary" as a pattern would
// also match @/lib/media/cloudinary.
const cloudinarySdk = {
  name: "cloudinary",
  message: "The cloudinary SDK is for scripts/ only until Phase 28 (Phase 9 spec, D6).",
};

// Pages read copy through block() and services through visibleServices() / visiblePillars()
// (tech-stack.md → Architectural rules 3; Phase 3 spec, D7).
const appImports = [
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
  {
    // Database access goes through server modules in lib/ (Phase 7 spec, D6).
    // Model types may still be imported.
    group: ["**/lib/generated/**"],
    allowTypeImports: true,
    message: "Query the database through a server module in lib/ (getDb()).",
  },
  {
    group: ["@prisma/*", "@neondatabase/serverless", "pg"],
    message: "Database drivers stay in lib/db.ts (Phase 7 spec, D6).",
  },
];

// Videos go through <VideoEmbed>, so no iframe loads before a click (Phase 8 spec, D10).
const iframeRule = {
  selector: "JSXOpeningElement[name.name='iframe']",
  message: "Embed videos with <VideoEmbed> from @/components/media/video-embed.",
};

// Off-site links go through <ExternalLink>, which checks https and sets
// rel="noopener noreferrer" (Phase 9 spec, D4).
const targetBlankRule = {
  selector: "JSXAttribute[name.name='target'][value.value='_blank']",
  message: "Link off-site with <ExternalLink> from @/components/shared/external-link.",
};

// The auth test helpers sign in through a test Better Auth instance and fake
// sessions: tests only, never app code (Phase 25 spec, D10).
const testingImport = {
  group: ["**/auth/testing", "**/auth/testing/**"],
  message: "lib/auth/testing is for tests only.",
};

const rawUnsafeRules = [
  { property: "$queryRawUnsafe", message: rawUnsafe },
  { property: "$executeRawUnsafe", message: rawUnsafe },
];

// Staff sign in only through the client API to /api/auth, because server-side
// calls skip Better Auth's rate limiting (tech-stack.md; Phase 24 spec, D5).
const serverSignIn =
  "Sign in through the client API (authClient) only: auth.api calls skip rate limiting.";
const serverSignInRule = {
  selector:
    "MemberExpression[object.property.name='api'][property.name=/^(signInEmail|verifyTOTP|verifyBackupCode)$/]",
  message: serverSignIn,
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // React escapes output; raw HTML injection is banned (specs/tech-stack.md).
      "react/no-danger": "error",
      "no-restricted-properties": ["error", ...rawUnsafeRules],
      "no-restricted-syntax": ["error", serverSignInRule],
    },
  },
  {
    // Owner scripts and tests may drive Better Auth directly.
    files: ["scripts/**", "**/*.test.ts", "e2e/**"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [cloudinarySdk], patterns: [cloudinaryImport, testingImport] },
      ],
    },
  },
  {
    files: ["app/**", "components/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [cloudinarySdk], patterns: [...appImports, cloudinaryImport, testingImport] },
      ],
    },
  },
  {
    files: ["components/media/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [cloudinarySdk], patterns: [...appImports, testingImport] },
      ],
    },
  },
  {
    files: ["scripts/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [cloudinaryImport, testingImport] }],
    },
  },
  {
    // Tests, e2e and the helpers themselves may use lib/auth/testing.
    files: ["**/*.test.ts", "**/*.test.tsx", "e2e/**", "lib/auth/testing/**"],
    rules: {
      "no-restricted-imports": ["error", { paths: [cloudinarySdk], patterns: [cloudinaryImport] }],
    },
  },
  {
    files: ["**/*.tsx", "**/*.jsx"],
    ignores: ["components/media/video-facade.tsx"],
    rules: { "no-restricted-syntax": ["error", iframeRule, targetBlankRule, serverSignInRule] },
  },
  {
    // The inquiry form's consent label opens /privacy in a new tab, so the form keeps its
    // input (Phase 18 spec, D11). Same-site, so not an <ExternalLink>.
    files: ["components/shared/external-link.tsx", "components/contact/inquiry-form.tsx"],
    rules: { "no-restricted-syntax": ["error", iframeRule, serverSignInRule] },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "lib/generated/**"]),
]);

export default eslintConfig;
