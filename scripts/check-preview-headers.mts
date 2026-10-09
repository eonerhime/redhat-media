// Fetches a deployed URL and asserts every header in lib/security/headers.ts
// is served with the exact expected value (spec D6). Runs on Node 24, which
// strips TypeScript types natively.
//
// Usage: node scripts/check-preview-headers.mts <url>
// Env:   VERCEL_AUTOMATION_BYPASS_SECRET (required for protected previews)

import { securityHeaders } from "../lib/security/headers.ts";

const url = process.argv[2];
if (!url) {
  console.error("Usage: node scripts/check-preview-headers.mts <url>");
  process.exit(2);
}

const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const res = await fetch(url, {
  redirect: "manual",
  headers: bypass ? { "x-vercel-protection-bypass": bypass } : {},
});

if (res.status !== 200) {
  console.error(`Expected 200 from ${url}, got ${res.status}.`);
  if (res.status === 401 || res.status === 403) {
    console.error("Is VERCEL_AUTOMATION_BYPASS_SECRET set and current?");
  }
  process.exit(1);
}

let failed = 0;
for (const { key, value } of securityHeaders) {
  const actual = res.headers.get(key);
  if (actual === value) {
    console.log(`ok   ${key}`);
  } else {
    failed++;
    console.error(`FAIL ${key}\n  expected: ${value}\n  actual:   ${actual ?? "(missing)"}`);
  }
}

if (failed) {
  console.error(`${failed} header(s) missing or wrong on ${url}`);
  process.exit(1);
}
console.log(`All ${securityHeaders.length} security headers served by ${url}`);
