import { randomUUID } from "node:crypto";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testPg, testPrisma } from "@/lib/db/test-client";
import { anonymiseClosedInquiries, purgeRateLimitHits, REDACTED } from "./core";

// The retention job (Phase 23 spec, D5, D6, D9; plan 3.2), run as rhm_retention. Fixtures are
// written and read back as rhm_app, because rhm_retention can read no personal column (D7).
// `NOW` is fixed, so the cut-offs are exact and only this file's rows sit near them.

const NOW = new Date("2026-10-24T12:00:00.000Z");
const MINUTE = 60_000;
const CUTOFF_24_MONTHS = new Date("2024-10-24T12:00:00.000Z");
const CUTOFF_30_DAYS = new Date(NOW.getTime() - 30 * 24 * 60 * MINUTE);

const db = testPrisma();
const RUN = randomUUID().slice(0, 8);
const ids: string[] = [];
let retention: pg.Client;

const inquiry = async (status: "NEW" | "CLOSED", closedAt: Date | null, anonymisedAt?: Date) => {
  const row = await db.inquiry.create({
    data: {
      clientName: "Ada Obi",
      companyName: "Glow Labs Ltd",
      email: `retention-${RUN}-${ids.length}@example.com`,
      phone: "+442079460000",
      services: ["WEB_APP"],
      projectTypes: ["WEB_APP.WEBSITE"],
      budgetRange: "FROM_1_5M_TO_5M",
      timeline: "ONE_TO_THREE_MONTHS",
      projectNotes: "A website.",
      status,
      consentAt: new Date("2024-01-10T09:00:00.000Z"),
      emailSentAt: new Date("2024-01-10T09:00:05.000Z"),
      createdAt: new Date("2024-01-10T09:00:00.000Z"),
      closedAt,
      anonymisedAt: anonymisedAt ?? null,
    },
  });
  ids.push(row.id);
  return row.id;
};

beforeAll(async () => {
  retention = await testPg("retention");
});

afterAll(async () => {
  await db.inquiry.deleteMany({ where: { id: { in: ids } } });
  await db.rateLimitHit.deleteMany({ where: { bucket: { startsWith: `test.${RUN}-` } } });
  await retention?.end();
  await db.$disconnect();
});

describe("anonymiseClosedInquiries", () => {
  it("anonymises only closed rows past 24 months, keeping scope and dates, and only once", async () => {
    const due = await inquiry("CLOSED", new Date(CUTOFF_24_MONTHS.getTime() - MINUTE));
    const recent = await inquiry("CLOSED", new Date(CUTOFF_24_MONTHS.getTime() + MINUTE));
    const open = await inquiry("NEW", null);
    const openWithOldClose = await inquiry("NEW", new Date("2020-01-01T00:00:00.000Z"));
    const earlier = new Date("2026-01-01T00:00:00.000Z");
    const done = await inquiry("CLOSED", new Date("2020-01-01T00:00:00.000Z"), earlier);

    expect(await anonymiseClosedInquiries(retention, NOW)).toBe(1);

    expect(await db.inquiry.findUniqueOrThrow({ where: { id: due } })).toMatchObject({
      clientName: REDACTED,
      companyName: null,
      email: REDACTED,
      phone: REDACTED,
      projectNotes: REDACTED,
      anonymisedAt: NOW,
      // Kept for lead statistics (D6).
      services: ["WEB_APP"],
      projectTypes: ["WEB_APP.WEBSITE"],
      budgetRange: "FROM_1_5M_TO_5M",
      timeline: "ONE_TO_THREE_MONTHS",
      status: "CLOSED",
      consentAt: new Date("2024-01-10T09:00:00.000Z"),
      emailSentAt: new Date("2024-01-10T09:00:05.000Z"),
      createdAt: new Date("2024-01-10T09:00:00.000Z"),
      closedAt: new Date(CUTOFF_24_MONTHS.getTime() - MINUTE),
    });

    for (const id of [recent, open, openWithOldClose])
      expect(await db.inquiry.findUniqueOrThrow({ where: { id } })).toMatchObject({
        clientName: "Ada Obi",
        companyName: "Glow Labs Ltd",
        projectNotes: "A website.",
        anonymisedAt: null,
      });
    // Already anonymised: left alone, its first anonymisedAt kept.
    expect(await db.inquiry.findUniqueOrThrow({ where: { id: done } })).toMatchObject({
      clientName: "Ada Obi",
      anonymisedAt: earlier,
    });

    expect(await anonymiseClosedInquiries(retention, NOW)).toBe(0);
  });
});

describe("purgeRateLimitHits", () => {
  it("deletes rows whose window ended more than 30 days ago and keeps newer ones", async () => {
    const hit = (name: string, windowEnd: Date) => ({
      bucket: `test.${RUN}-${name}`,
      keyHash: "0".repeat(64),
      windowEnd,
    });
    await db.rateLimitHit.createMany({
      data: [
        hit("old", new Date(CUTOFF_30_DAYS.getTime() - MINUTE)),
        hit("new", new Date(CUTOFF_30_DAYS.getTime() + MINUTE)),
        hit("current", NOW),
      ],
    });

    expect(await purgeRateLimitHits(retention, NOW)).toBeGreaterThanOrEqual(1);
    const left = await db.rateLimitHit.findMany({
      where: { bucket: { startsWith: `test.${RUN}-` } },
      select: { bucket: true },
      orderBy: { bucket: "asc" },
    });
    expect(left.map((row) => row.bucket)).toEqual([`test.${RUN}-current`, `test.${RUN}-new`]);

    expect(await purgeRateLimitHits(retention, NOW)).toBe(0);
  });
});
