import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { testPg, testPrisma } from "@/lib/db/test-client";

// The Phase 19 migration is additive (Phase 19 spec, D2, C3): a row saved without project types,
// as every Phase 18 row was, reads back with an empty list, and the list is never NULL.
// rhm_readonly still cannot read "projectTypes" (Phase 17 spec, D4; Phase 20 spec, D10).

const db = testPrisma();
const RUN = randomUUID().slice(0, 8);
const id = `phase18-${RUN}`;

afterAll(async () => {
  await db.inquiry.deleteMany({ where: { id } });
  await db.$disconnect();
});

describe('Inquiry."projectTypes" (Postgres)', () => {
  it("defaults to an empty list for a row saved without it", async () => {
    await db.$executeRaw`
      INSERT INTO "Inquiry" ("id", "clientName", "email", "phone", "services", "projectNotes",
                             "consentAt", "updatedAt")
      VALUES (${id}, 'Phase 18 row', ${`${id}@example.com`}, '+2348031234567',
              ARRAY['PHOTOGRAPHY']::"ServiceCategory"[], 'Saved before Phase 19.', now(), now())`;
    const row = await db.inquiry.findUniqueOrThrow({ where: { id } });
    expect(row).toMatchObject({ projectTypes: [], budgetRange: null, timeline: null });
  });

  it("refuses NULL", async () => {
    await expect(
      db.$executeRaw`UPDATE "Inquiry" SET "projectTypes" = NULL WHERE "id" = ${id}`,
    ).rejects.toThrow();
  });

  it("stays unreadable by rhm_readonly", async () => {
    const readonly = await testPg("readonly");
    try {
      await expect(readonly.query('SELECT "projectTypes" FROM "Inquiry" LIMIT 1')).rejects.toThrow(
        /permission denied/,
      );
    } finally {
      await readonly.end();
    }
  });
});
