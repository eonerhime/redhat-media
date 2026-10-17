// Pre-commit secret scan of staged changes (lefthook). Fails closed: a missing
// gitleaks binary blocks the commit. No shell, so it behaves the same on every OS.
import { spawnSync } from "node:child_process";

const result = spawnSync(
  "gitleaks",
  ["git", "--pre-commit", "--staged", "--redact", "--no-banner"],
  {
    stdio: "inherit",
  },
);

if (result.error) {
  console.error(
    result.error.code === "ENOENT"
      ? "gitleaks is not installed or not on PATH. See CLAUDE.md -> Setup."
      : `gitleaks failed to start: ${result.error.message}`,
  );
  process.exit(1);
}
process.exit(result.status ?? 1);
