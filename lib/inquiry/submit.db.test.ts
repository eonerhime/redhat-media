import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { serviceCategories } from "../../content/services";
import { testPrisma } from "@/lib/db/test-client";
import { createRateLimiter, hashKey } from "@/lib/security/rate-limit-core";
import { ELAPSED_FIELD, HONEYPOT_FIELD, TURNSTILE_FIELD } from "./fields";
import { submitInquiryCore, type SubmitDeps } from "./submit-core";

// Roadmap Phase 18 "Done when": a submission appears in the database, and the
// sixth from one IP in 10 minutes gets a 429 result and saves nothing (Phase 18
// spec, D6, D13). The real limiter and save, as rhm_app; Turnstile is faked.

const db = testPrisma();
const RUN = randomUUID().slice(0, 8);
// A salt per run keeps this run's rate-limit rows apart from any other's.
const SALT = `submit-${RUN}-`.padEnd(32, "x");
const IP = "198.51.100.23";
const email = `submit-${RUN}@example.com`;

afterAll(async () => {
  await db.inquiry.deleteMany({ where: { email } });
  await db.rateLimitHit.deleteMany({ where: { keyHash: hashKey(SALT, IP) } });
  await db.$disconnect();
});

const deps: SubmitDeps = {
  enabled: true,
  now: () => new Date(),
  rateLimit: createRateLimiter(db, SALT),
  verifyTurnstile: async () => true,
  visibleCategories: async () => serviceCategories,
  save: async (data) => {
    await db.inquiry.create({ data });
  },
};

function form(n: number): FormData {
  const data = new FormData();
  const fields = {
    clientName: `Ada Obi ${n}`,
    email,
    phone: "0803 123 4567",
    companyName: "",
    projectNotes: "A launch shoot and a landing page for our new product.",
    consent: "on",
    [HONEYPOT_FIELD]: "",
    [ELAPSED_FIELD]: "20000",
    [TURNSTILE_FIELD]: "token",
  };
  for (const [name, value] of Object.entries(fields)) data.append(name, value);
  data.append("services", "PHOTOGRAPHY");
  data.append("services", "WEB_APP");
  return data;
}

describe("submitInquiryCore (Postgres)", () => {
  it("saves five inquiries from one IP, then answers 429 and saves nothing more", async () => {
    const results = [];
    for (let n = 1; n <= 6; n++) results.push(await submitInquiryCore(form(n), IP, deps));

    expect(results.map((r) => r.status)).toEqual([
      "success",
      "success",
      "success",
      "success",
      "success",
      "rate_limited",
    ]);
    expect(results[5]).toEqual({ status: "rate_limited", code: 429 });

    const saved = await db.inquiry.findMany({ where: { email }, orderBy: { clientName: "asc" } });
    expect(saved.map((row) => row.clientName)).toEqual([1, 2, 3, 4, 5].map((n) => `Ada Obi ${n}`));
    expect(saved[0]).toMatchObject({
      phone: "+2348031234567",
      companyName: null,
      services: ["PHOTOGRAPHY", "WEB_APP"],
      budgetRange: null,
      timeline: null,
      status: "NEW",
    });
  });
});
