import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
import { serviceCategories } from "../../content/services";
import { testPrisma } from "@/lib/db/test-client";
import { createRateLimiter, hashKey } from "@/lib/security/rate-limit-core";
import { ELAPSED_FIELD, HONEYPOT_FIELD, TURNSTILE_FIELD } from "./fields";
import { notifyInquiryCore, type NotifyDeps } from "./notify-core";
import { submitInquiryCore, type SavedInquiry, type SubmitDeps } from "./submit-core";

// Roadmap Phase 18 "Done when": a submission appears in the database, and the
// sixth from one IP in 10 minutes gets a 429 result and saves nothing (Phase 18
// spec, D6, D13). The real limiter and save, as rhm_app; Turnstile is faked.
// Phase 19 "Done when": a multi-service inquiry is saved with its full scope (D13).
// Phase 20 "Done when": with Resend unreachable, the inquiry is still saved and the failure is
// logged (Phase 20 spec, D14).

const db = testPrisma();
const RUN = randomUUID().slice(0, 8);
// A salt per run keeps this run's rate-limit rows apart from any other's.
const SALT = `submit-${RUN}-`.padEnd(32, "x");
const IP = "198.51.100.23";
const email = `submit-${RUN}@example.com`;
// The email tests use their own IP, so the 429 test's five-per-IP count stays its own.
const ackIp = "198.51.100.24";
const saved: SavedInquiry[] = [];

afterAll(async () => {
  await db.inquiry.deleteMany({ where: { email } });
  await db.rateLimitHit.deleteMany({
    where: { keyHash: { in: [hashKey(SALT, IP), hashKey(SALT, ackIp), hashKey(SALT, email)] } },
  });
  await db.$disconnect();
});

const deps: SubmitDeps = {
  enabled: true,
  now: () => new Date(),
  rateLimit: createRateLimiter(db, SALT),
  verifyTurnstile: async () => true,
  visibleCategories: async () => serviceCategories,
  save: async (data) => (await db.inquiry.create({ data, select: { id: true } })).id,
  ackEnabled: false,
  notify: (inquiry) => saved.push(inquiry),
};

// The real markSent from lib/inquiry/notify.ts, on the test database.
const markSent: NotifyDeps["markSent"] = async (id, column, at) => {
  await db.inquiry.updateMany({ where: { id, [column]: null }, data: { [column]: at } });
};

function notifyDeps(send: NotifyDeps["send"], log: NotifyDeps["log"]): NotifyDeps {
  const rendered = async () => ({ subject: "Test", html: "<p>Test</p>", text: "Test" });
  return {
    send,
    renderTeam: rendered,
    renderAck: rendered,
    markSent,
    now: () => new Date(),
    notificationTo: ["team@example.com"],
    ackReplyTo: "hello@example.com",
    siteUrl: "https://example.com",
    log,
  };
}

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
  for (const id of ["PHOTOGRAPHY.EVENT", "PHOTOGRAPHY.PRODUCT", "WEB_APP.NOT_SURE"])
    data.append("projectTypes", id);
  data.append("budgetRange", "FROM_500K_TO_1_5M");
  data.append("timeline", "ONE_TO_THREE_MONTHS");
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
      projectTypes: ["PHOTOGRAPHY.EVENT", "PHOTOGRAPHY.PRODUCT", "WEB_APP.NOT_SURE"],
      budgetRange: "FROM_500K_TO_1_5M",
      timeline: "ONE_TO_THREE_MONTHS",
      status: "NEW",
    });
  });

  it("keeps the inquiry when Resend is unreachable, logs it, and leaves emailSentAt NULL", async () => {
    const result = await submitInquiryCore(form(7), ackIp, { ...deps, ackEnabled: true });
    expect(result).toEqual({ status: "success", code: 201, acknowledgment: true });
    const inquiry = saved.at(-1)!;

    const log = vi.fn();
    const unreachable = async () => ({ status: "failed", error: "TypeError" }) as const;
    expect(await notifyInquiryCore(inquiry, notifyDeps(unreachable, log))).toEqual({
      team: "failed",
      ack: "failed",
    });

    const row = await db.inquiry.findUniqueOrThrow({ where: { id: inquiry.id } });
    expect(row).toMatchObject({ clientName: "Ada Obi 7", emailSentAt: null, ackSentAt: null });
    expect(log).toHaveBeenCalledWith("[email] team notification failed", {
      id: inquiry.id,
      error: "TypeError",
    });
  });

  it("records each send once, never moving the first time", async () => {
    await submitInquiryCore(form(8), ackIp, { ...deps, ackEnabled: true });
    const inquiry = saved.at(-1)!;
    const sent = async () => ({ status: "sent", id: "em_1" }) as const;

    await notifyInquiryCore(inquiry, notifyDeps(sent, vi.fn()));
    const first = await db.inquiry.findUniqueOrThrow({ where: { id: inquiry.id } });
    expect(first.emailSentAt).toBeInstanceOf(Date);
    expect(first.ackSentAt).toBeInstanceOf(Date);

    await notifyInquiryCore(inquiry, notifyDeps(sent, vi.fn()));
    const second = await db.inquiry.findUniqueOrThrow({ where: { id: inquiry.id } });
    expect(second.emailSentAt).toEqual(first.emailSentAt);
    expect(second.ackSentAt).toEqual(first.ackSentAt);
  });

  it("allows three acknowledgments a day to one address, then skips them (Phase 20 spec, D6)", async () => {
    // Inquiries 7 and 8 above used two; this is the third, then the fourth is over.
    const third = await submitInquiryCore(form(9), ackIp, { ...deps, ackEnabled: true });
    const fourth = await submitInquiryCore(form(10), ackIp, { ...deps, ackEnabled: true });
    expect(third).toMatchObject({ status: "success", acknowledgment: true });
    expect(fourth).toMatchObject({ status: "success", acknowledgment: false });
    expect(saved.at(-1)!.acknowledge).toBe(false);
  });
});
