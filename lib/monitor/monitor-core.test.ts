import { describe, expect, it } from "vitest";
import {
  minUptimeSeconds,
  missingPath,
  portfolioStateCheck,
  report,
  saturationCheck,
  sitePaths,
  statusCheck,
  testAlertCheck,
  transactionsPerMinuteLimit,
  unsentNotificationsCheck,
  volumeCheck,
} from "./monitor-core";

// Phase 15 spec, D7.
describe("monitor checks", () => {
  it("covers every template and the sitemap, and probes a path no route matches", () => {
    expect(sitePaths).toEqual(expect.arrayContaining(["/", "/contact", "/sitemap.xml"]));
    expect(sitePaths).not.toContain(missingPath);
  });

  it("passes only the expected status", () => {
    expect(statusCheck("/", 200, 200).ok).toBe(true);
    expect(statusCheck("/", 500, 200)).toMatchObject({ ok: false, detail: "500 (want 200)" });
    expect(statusCheck(missingPath, 404, 404).ok).toBe(true);
  });

  it("reads the portfolio listing state, whatever the attribute order", () => {
    const html = (attrs: string) => `<main><div ${attrs}><p>x</p></div></main>`;
    expect(portfolioStateCheck(html('data-state="ready" data-testid="portfolio-listing"')).ok).toBe(
      true,
    );
    expect(
      portfolioStateCheck(html('data-testid="portfolio-listing" data-state="unavailable"')),
    ).toMatchObject({ ok: false, detail: "state unavailable" });
    expect(portfolioStateCheck("<main></main>")).toMatchObject({
      ok: false,
      detail: "state missing",
    });
  });

  it("ignores a data-state on another element", () => {
    const html =
      '<div data-state="ready"></div><div data-testid="portfolio-listing" data-state="empty">';
    expect(portfolioStateCheck(html).detail).toBe("state empty");
  });

  it("fails connection saturation at 80% of the usable connections", () => {
    // 0.25 CU: 104 connections, 7 reserved, so 97 usable; 80% is 77.6.
    expect(saturationCheck(77, 104, 7).ok).toBe(true);
    expect(saturationCheck(78, 104, 7)).toMatchObject({ ok: false });
    expect(saturationCheck(1, 7, 7).ok).toBe(false);
  });

  it("fails query volume above the limit over the sample", () => {
    expect(volumeCheck(transactionsPerMinuteLimit, 60, 3600).ok).toBe(true);
    expect(volumeCheck(transactionsPerMinuteLimit + 1, 60, 3600).ok).toBe(false);
    expect(volumeCheck(transactionsPerMinuteLimit, 30, 3600)).toMatchObject({ ok: false });
  });

  it("does not sample a compute that has just started", () => {
    expect(volumeCheck(1000, 60, minUptimeSeconds - 1)).toMatchObject({
      ok: true,
      detail: `not sampled: compute started ${minUptimeSeconds - 1} s ago`,
    });
    expect(volumeCheck(1000, 60, minUptimeSeconds).ok).toBe(false);
  });

  it("reports a test alert as a failure that says it is a test", () => {
    const result = report([statusCheck("/", 200, 200), testAlertCheck]);
    expect(result.ok).toBe(false);
    expect(result.lines).toEqual([
      "ok   GET /: 200 (want 200)",
      "FAIL test alert: TEST ALERT — not an incident",
    ]);
  });
});

// Phase 20 spec, D10. The query's 15-minute to 24-hour window is tested on Postgres
// (lib/monitor/unsent.db.test.ts).
describe("unsentNotificationsCheck", () => {
  it("passes with none unsent", () => {
    expect(unsentNotificationsCheck(0)).toEqual({
      name: "inquiry notifications",
      ok: true,
      detail: "none unsent (15 min to 24 h old)",
    });
  });

  it("fails with any unsent, giving the count only and the runbook", () => {
    const check = unsentNotificationsCheck(2);
    expect(check.ok).toBe(false);
    expect(check.detail).toBe(
      "2 unsent 15 min to 24 h after saving (see docs/runbooks/monitoring.md)",
    );
  });
});
