import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { testPg, testPrisma } from "@/lib/db/test-client";
import { unsentGraceMinutes, unsentNotificationsSql, unsentWindowHours } from "./monitor-core";

// Phase 20 spec, D10: the monitor's query, run as rhm_readonly, counts an inquiry only while its
// team notification is unsent between 15 minutes and 24 hours after it was saved.

const db = testPrisma();
const RUN = randomUUID().slice(0, 8);
const email = `unsent-${RUN}@example.com`;
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

afterAll(async () => {
  await db.inquiry.deleteMany({ where: { email } });
  await db.$disconnect();
});

async function unsent(): Promise<number> {
  const readonly = await testPg("readonly");
  try {
    const { rows } = await readonly.query<{ unsent: number }>(unsentNotificationsSql, [
      unsentGraceMinutes,
      unsentWindowHours,
    ]);
    return rows[0]!.unsent;
  } finally {
    await readonly.end();
  }
}

const row = (name: string, createdAt: Date, emailSentAt: Date | null) => ({
  clientName: name,
  email,
  phone: "+2348031234567",
  services: ["PHOTOGRAPHY" as const],
  projectNotes: "Monitor test.",
  consentAt: createdAt,
  createdAt,
  emailSentAt,
});

describe("unsentNotificationsSql (Postgres, rhm_readonly)", () => {
  it("counts only unsent rows from 15 minutes to 24 hours old", async () => {
    const before = await unsent();
    await db.inquiry.createMany({
      data: [
        row("counted: 1 hour, unsent", minutesAgo(60), null),
        row("counted: 23 hours, unsent", minutesAgo(23 * 60), null),
        row("too new: 5 minutes", minutesAgo(5), null),
        row("too old: 25 hours", minutesAgo(25 * 60), null),
        row("sent", minutesAgo(60), minutesAgo(59)),
      ],
    });
    expect((await unsent()) - before).toBe(2);
  });
});
