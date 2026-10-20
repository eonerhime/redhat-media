import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { testPrisma } from "@/lib/db/test-client";
import { inquiryInputSchema, toInquiryData } from "@/lib/validation/inquiry";

// An inquiry parsed by the shared schema saves and reads back intact as
// rhm_app (Phase 17 spec, D7, D9). From Phase 19 the scope is required (D3).

const db = testPrisma();
const RUN = randomUUID().slice(0, 8);
const email = `inquiry-${RUN}@example.com`;

afterAll(async () => {
  await db.inquiry.deleteMany({ where: { email } });
  await db.$disconnect();
});

describe("Inquiry (Postgres)", () => {
  it("saves a parsed inquiry and reads it back with its defaults", async () => {
    const now = new Date("2026-10-20T09:00:00.000Z");
    const values = inquiryInputSchema.parse({
      clientName: "Ada Obi",
      companyName: "Glow Labs Ltd",
      email,
      phone: "+44 20 7946 0000",
      services: ["WEB_APP", "VIDEOGRAPHY"],
      projectTypes: ["WEB_APP.WEBSITE", "VIDEOGRAPHY.PROMO"],
      budgetRange: "FROM_1_5M_TO_5M",
      timeline: "ONE_TO_THREE_MONTHS",
      projectNotes: "A launch video and a website.\nWe go live in March.",
      consent: true,
    });

    const { id } = await db.inquiry.create({ data: toInquiryData(values, now) });
    const saved = await db.inquiry.findUniqueOrThrow({ where: { id } });

    expect(saved).toMatchObject({
      clientName: "Ada Obi",
      companyName: "Glow Labs Ltd",
      email,
      phone: "+442079460000",
      services: ["WEB_APP", "VIDEOGRAPHY"],
      projectTypes: ["WEB_APP.WEBSITE", "VIDEOGRAPHY.PROMO"],
      budgetRange: "FROM_1_5M_TO_5M",
      timeline: "ONE_TO_THREE_MONTHS",
      projectNotes: "A launch video and a website.\nWe go live in March.",
      status: "NEW",
      consentAt: now,
      emailSentAt: null,
      ackSentAt: null,
    });
    expect(saved.id).toMatch(/^c[a-z0-9]{20,}$/);
    expect(saved.createdAt).toBeInstanceOf(Date);
  });

  it('saves a minimal inquiry with its "not sure" scope', async () => {
    const values = inquiryInputSchema.parse({
      clientName: "Tunde Bello",
      email,
      phone: "0803 123 4567",
      services: ["PHOTOGRAPHY"],
      projectTypes: ["PHOTOGRAPHY.NOT_SURE"],
      budgetRange: "NOT_SURE",
      timeline: "FLEXIBLE",
      projectNotes: "Corporate headshots for 12 staff.",
      consent: true,
    });

    const saved = await db.inquiry.create({ data: toInquiryData(values, new Date()) });

    expect(saved).toMatchObject({
      companyName: null,
      phone: "+2348031234567",
      projectTypes: ["PHOTOGRAPHY.NOT_SURE"],
      budgetRange: "NOT_SURE",
      timeline: "FLEXIBLE",
      status: "NEW",
    });
  });
});
