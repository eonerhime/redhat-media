// Lighthouse on mobile for every template, three runs each; fails when a median category score is
// below 0.90 (Phase 15 spec, D6, amended). Runs on Node 24, which strips TypeScript types natively.
//
// Usage: node scripts/lighthouse.mts <origin>
// Env:   VERCEL_AUTOMATION_BYPASS_SECRET (for a protected preview)
//        PW_CHANNEL (optional browser channel, e.g. chrome or msedge)
//
// A protected preview is reached with Vercel's bypass cookie, set in the browser for the preview's
// own host only. Lighthouse's extraHeaders would send the secret to every origin the page loads
// (Cloudinary, video thumbnails). Prints scores only: no report is written, so nothing holding
// a credential can end up in a log or artifact (C6).

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";
import {
  budget,
  budgetFailures,
  bypassCookie,
  categories,
  lighthousePaths,
  medianScores,
  runsPerPage,
  type Scores,
} from "../lib/perf/lighthouse-core.ts";

const origin = process.argv[2] ? new URL(process.argv[2]).origin : undefined;
if (!origin) {
  console.error("Usage: node scripts/lighthouse.mts <origin>");
  process.exit(2);
}

const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const port = 9333;

/** The bypass cookie for a protected deployment, from one request that asks Vercel to set it. */
async function previewCookie() {
  if (!secret) return undefined;
  const res = await fetch(`${origin}/`, {
    redirect: "manual",
    headers: { "x-vercel-protection-bypass": secret, "x-vercel-set-bypass-cookie": "true" },
  });
  const cookie = bypassCookie(res.headers.getSetCookie());
  if (!cookie) {
    console.error(`No bypass cookie from ${origin} (status ${res.status}). Is the secret current?`);
    process.exit(1);
  }
  return cookie;
}

const cookie = await previewCookie();
const profile = await mkdtemp(join(tmpdir(), "rhm-lighthouse-"));
const context = await chromium.launchPersistentContext(profile, {
  headless: true,
  channel: process.env.PW_CHANNEL || undefined,
  args: [`--remote-debugging-port=${port}`],
});

try {
  if (cookie) {
    const host = new URL(origin).hostname;
    await context.addCookies([
      { ...cookie, domain: host, path: "/", secure: true, httpOnly: true, sameSite: "Lax" },
    ]);
  }
  const page = context.pages()[0] ?? (await context.newPage());
  const cdp = await context.newCDPSession(page);

  const results: Record<string, Scores> = {};
  for (const path of lighthousePaths) {
    const runs: Scores[] = [];
    for (let run = 0; run < runsPerPage; run++) {
      // Storage reset is off so the cookie survives; clear the HTTP cache so every run is cold.
      await cdp.send("Network.clearBrowserCache");
      const result = await lighthouse(`${origin}${path}`, {
        port,
        logLevel: "error",
        output: "json",
        disableStorageReset: true,
        onlyCategories: [...categories],
        // Previews send X-Robots-Tag: noindex on purpose; production is scored in full (Phase 16).
        skipAudits: cookie ? ["is-crawlable"] : [],
      });
      const lhr = result?.lhr;
      if (!lhr || lhr.runtimeError) {
        console.error(`${path}: Lighthouse failed (${lhr?.runtimeError?.code ?? "no result"})`);
        process.exitCode = 1;
        break;
      }
      runs.push(
        Object.fromEntries(categories.map((c) => [c, lhr.categories[c]?.score ?? 0])) as Scores,
      );
    }
    if (runs.length === runsPerPage) results[path] = medianScores(runs);
  }

  console.log(`Lighthouse (mobile), median of ${runsPerPage} runs, budget ${budget}:`);
  console.table(
    Object.fromEntries(
      Object.entries(results).map(([path, s]) => [
        path,
        Object.fromEntries(categories.map((c) => [c, Math.round(s[c] * 100)])),
      ]),
    ),
  );
  const failures = budgetFailures(results);
  if (failures.length > 0) {
    console.error(`Below budget:\n${failures.join("\n")}`);
    process.exitCode = 1;
  }
} finally {
  await context.close();
  await rm(profile, { recursive: true, force: true });
}
