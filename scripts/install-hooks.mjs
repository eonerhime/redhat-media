// `prepare` hook: installs lefthook git hooks on developer machines only.
// Skipped in CI and on Vercel, where there is no need for hooks (and Vercel
// builds may have no .git directory).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";

if (process.env.CI || process.env.VERCEL || !existsSync(".git")) {
  process.exit(0);
}

// Run lefthook's JS entry with the current node binary: no shell needed on any OS.
const lefthook = createRequire(import.meta.url).resolve("lefthook/bin/index.js");
execFileSync(process.execPath, [lefthook, "install"], { stdio: "inherit" });
