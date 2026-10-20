import { describe, expect, it, vi } from "vitest";
import type { ServiceCategory } from "../../content/services";
import type { RateLimiter } from "@/lib/security/rate-limit-core";
import { inquiryInputSchema, toInquiryData } from "@/lib/validation/inquiry";
import { ELAPSED_FIELD, HONEYPOT_FIELD, TURNSTILE_FIELD } from "./fields";
import {
  formValues,
  MAX_FILL_MS,
  MIN_FILL_MS,
  MUTED_SERVICE_ERROR,
  submitInquiryCore,
  type SubmitDeps,
} from "./submit-core";

const NOW = new Date("2026-10-20T12:00:00.000Z");
const IP = "203.0.113.7";

const valid = {
  services: ["PHOTOGRAPHY", "WEB_APP"],
  projectTypes: ["PHOTOGRAPHY.EVENT", "PHOTOGRAPHY.PRODUCT", "WEB_APP.WEBSITE"],
  budgetRange: "FROM_1_5M_TO_5M",
  timeline: "WITHIN_1_MONTH",
  clientName: "Ada Obi",
  email: "ada@example.com",
  phone: "0803 123 4567",
  companyName: "",
  projectNotes: "A launch shoot and a landing page for our new product.",
  consent: "on",
};

function form(overrides: Record<string, string | string[] | null> = {}): FormData {
  const fields: Record<string, string | string[] | null> = {
    ...valid,
    [HONEYPOT_FIELD]: "",
    [ELAPSED_FIELD]: "20000",
    [TURNSTILE_FIELD]: "token",
    ...overrides,
  };
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    if (value === null) continue;
    for (const v of Array.isArray(value) ? value : [value]) data.append(name, v);
  }
  return data;
}

const allow: RateLimiter = async () => ({ allowed: true, remaining: 1, resetAt: NOW });

function deps(overrides: Partial<SubmitDeps> = {}) {
  return {
    enabled: true,
    now: () => NOW,
    rateLimit: vi.fn(allow),
    verifyTurnstile: vi.fn(async () => true),
    visibleCategories: async (): Promise<readonly ServiceCategory[]> => [
      "PHOTOGRAPHY",
      "VIDEOGRAPHY",
      "WEB_APP",
    ],
    save: vi.fn(async () => {}),
    logError: vi.fn(),
    ...overrides,
  } satisfies SubmitDeps;
}

describe("submitInquiryCore (Phase 18 spec, D3)", () => {
  it("saves exactly toInquiryData(values, now) and answers 201", async () => {
    const d = deps();
    expect(await submitInquiryCore(form(), IP, d)).toEqual({ status: "success", code: 201 });
    const expected = toInquiryData(inquiryInputSchema.parse(formValues(form())), NOW);
    expect(d.save).toHaveBeenCalledExactlyOnceWith(expected);
    expect(expected.phone).toBe("+2348031234567");
  });

  it("saves the full scope of a multi-service inquiry (Phase 19 spec, D4)", async () => {
    const d = deps();
    await submitInquiryCore(form(), IP, d);
    expect(d.save).toHaveBeenCalledWith(
      expect.objectContaining({
        services: ["PHOTOGRAPHY", "WEB_APP"],
        projectTypes: ["PHOTOGRAPHY.EVENT", "PHOTOGRAPHY.PRODUCT", "WEB_APP.WEBSITE"],
        budgetRange: "FROM_1_5M_TO_5M",
        timeline: "WITHIN_1_MONTH",
      }),
    );
  });

  it("checks both rate limits for the IP, then Turnstile with the inquiry action", async () => {
    const d = deps();
    await submitInquiryCore(form(), IP, d);
    expect(vi.mocked(d.rateLimit).mock.calls).toEqual([
      ["inquiry", IP, { max: 5, windowSec: 600 }],
      ["inquiry.day", IP, { max: 20, windowSec: 86_400 }],
    ]);
    expect(d.verifyTurnstile).toHaveBeenCalledExactlyOnceWith("token", IP, "inquiry");
  });

  it("sends no remote IP to Turnstile when the IP is unknown", async () => {
    const d = deps();
    await submitInquiryCore(form(), "unknown", d);
    expect(vi.mocked(d.rateLimit).mock.calls[0]![1]).toBe("unknown");
    expect(d.verifyTurnstile).toHaveBeenCalledWith("token", undefined, "inquiry");
  });

  it("answers 503 and does nothing else when the switch is off", async () => {
    const d = deps({ enabled: false });
    expect(await submitInquiryCore(form(), IP, d)).toEqual({ status: "unavailable", code: 503 });
    expect(d.rateLimit).not.toHaveBeenCalled();
    expect(d.save).not.toHaveBeenCalled();
  });

  it.each([
    ["a filled honeypot", { [HONEYPOT_FIELD]: "https://spam.example" }],
    ["a missing elapsedMs", { [ELAPSED_FIELD]: null }],
    ["an empty elapsedMs", { [ELAPSED_FIELD]: "" }],
    ["an elapsedMs that is not a number", { [ELAPSED_FIELD]: "soon" }],
    ["a negative elapsedMs", { [ELAPSED_FIELD]: "-5000" }],
    ["a fractional elapsedMs", { [ELAPSED_FIELD]: "5000.5" }],
    ["a submit under 3 seconds", { [ELAPSED_FIELD]: String(MIN_FILL_MS - 1) }],
    ["a form open over 24 hours", { [ELAPSED_FIELD]: String(MAX_FILL_MS + 1) }],
  ])("rejects %s with 403 before parsing or counting", async (_, overrides) => {
    const d = deps();
    expect(await submitInquiryCore(form(overrides), IP, d)).toEqual({
      status: "rejected",
      code: 403,
    });
    expect(d.rateLimit).not.toHaveBeenCalled();
    expect(d.verifyTurnstile).not.toHaveBeenCalled();
    expect(d.save).not.toHaveBeenCalled();
  });

  it.each([MIN_FILL_MS, MAX_FILL_MS])("accepts a form open exactly %i ms", async (ms) => {
    const result = await submitInquiryCore(form({ [ELAPSED_FIELD]: String(ms) }), IP, deps());
    expect(result.status).toBe("success");
  });

  it("ignores the server clock: the check is the duration alone", async () => {
    const d = deps({ now: () => new Date("2099-01-01T00:00:00.000Z") });
    expect((await submitInquiryCore(form(), IP, d)).status).toBe("success");
  });

  it("answers 400 with one message per invalid field and the submitted values, uncounted", async () => {
    const d = deps();
    const result = await submitInquiryCore(
      form({
        email: "ada@",
        phone: "12",
        projectTypes: ["WEB_APP.WEBSITE"],
        budgetRange: null,
        timeline: "YESTERDAY",
        consent: null,
      }),
      IP,
      d,
    );
    expect(result).toEqual({
      status: "invalid",
      code: 400,
      fieldErrors: {
        projectTypes: "Choose at least one kind of project for Photography.",
        budgetRange: 'Choose a budget range, or "Not sure yet".',
        timeline: "Choose a timeline from the list.",
        email: "Enter a valid email address, like name@example.com.",
        phone:
          "Enter a phone number like 0803 123 4567, or with a country code like +44 20 7946 0000.",
        consent: "Please agree to the privacy notice so we can keep your details.",
      },
      values: {
        ...valid,
        projectTypes: ["WEB_APP.WEBSITE"],
        budgetRange: "",
        timeline: "YESTERDAY",
        email: "ada@",
        phone: "12",
        consent: false,
      },
    });
    expect(d.rateLimit).not.toHaveBeenCalled();
    expect(d.save).not.toHaveBeenCalled();
  });

  it("echoes only the form fields, never the honeypot, time or token", async () => {
    const result = await submitInquiryCore(form({ clientName: "" }), IP, deps());
    if (result.status !== "invalid") throw new Error(`expected invalid, got ${result.status}`);
    expect(Object.keys(result.values).sort()).toEqual(
      [
        "budgetRange",
        "clientName",
        "companyName",
        "consent",
        "email",
        "phone",
        "projectNotes",
        "projectTypes",
        "services",
        "timeline",
      ].sort(),
    );
  });

  it("refuses a service muted since the form was built (D8), uncounted", async () => {
    const d = deps({ visibleCategories: async () => ["WEB_APP"] });
    const result = await submitInquiryCore(form(), IP, d);
    expect(result).toMatchObject({
      status: "invalid",
      code: 400,
      fieldErrors: { services: MUTED_SERVICE_ERROR },
    });
    expect(d.rateLimit).not.toHaveBeenCalled();
    expect(d.save).not.toHaveBeenCalled();
  });

  it("refuses the project types of a muted service with it (Phase 19 spec, D4)", async () => {
    const d = deps({ visibleCategories: async () => ["WEB_APP"] });
    const result = await submitInquiryCore(
      form({ services: ["PHOTOGRAPHY"], projectTypes: ["PHOTOGRAPHY.NOT_SURE"] }),
      IP,
      d,
    );
    expect(result).toMatchObject({
      status: "invalid",
      fieldErrors: { services: MUTED_SERVICE_ERROR },
    });
    expect(d.save).not.toHaveBeenCalled();
  });

  it("refuses a project type of a service not chosen, uncounted", async () => {
    const d = deps();
    const result = await submitInquiryCore(
      form({ services: ["WEB_APP"], projectTypes: ["WEB_APP.SHOP", "PHOTOGRAPHY.EVENT"] }),
      IP,
      d,
    );
    expect(result).toMatchObject({
      status: "invalid",
      fieldErrors: { projectTypes: "Choose project types from the list." },
    });
    expect(d.rateLimit).not.toHaveBeenCalled();
  });

  it("answers 429 over the 10-minute limit, without the daily count or Turnstile", async () => {
    const d = deps({
      rateLimit: vi.fn<RateLimiter>(async (bucket) => ({
        allowed: bucket !== "inquiry",
        remaining: 0,
        resetAt: NOW,
      })),
    });
    expect(await submitInquiryCore(form(), IP, d)).toEqual({ status: "rate_limited", code: 429 });
    expect(d.rateLimit).toHaveBeenCalledTimes(1);
    expect(d.verifyTurnstile).not.toHaveBeenCalled();
    expect(d.save).not.toHaveBeenCalled();
  });

  it("answers 429 over the daily limit", async () => {
    const d = deps({
      rateLimit: vi.fn<RateLimiter>(async (bucket) => ({
        allowed: bucket !== "inquiry.day",
        remaining: 0,
        resetAt: NOW,
      })),
    });
    expect(await submitInquiryCore(form(), IP, d)).toEqual({ status: "rate_limited", code: 429 });
    expect(d.save).not.toHaveBeenCalled();
  });

  it("rejects with 403 when Turnstile refuses the token", async () => {
    const d = deps({ verifyTurnstile: vi.fn(async () => false) });
    expect(await submitInquiryCore(form(), IP, d)).toEqual({ status: "rejected", code: 403 });
    expect(d.save).not.toHaveBeenCalled();
  });

  it("passes a missing token to Turnstile as empty, which refuses it", async () => {
    const d = deps();
    await submitInquiryCore(form({ [TURNSTILE_FIELD]: null }), IP, d);
    expect(d.verifyTurnstile).toHaveBeenCalledWith("", IP, "inquiry");
  });

  it("answers 500 and logs when the save fails", async () => {
    const failure = new Error("connection refused");
    const d = deps({ save: vi.fn(async () => Promise.reject(failure)) });
    expect(await submitInquiryCore(form(), IP, d)).toEqual({ status: "error", code: 500 });
    expect(d.logError).toHaveBeenCalledWith("[inquiry] submit failed", failure);
  });

  it("answers 500 when the rate limiter's database fails (fail closed)", async () => {
    const d = deps({
      rateLimit: vi.fn<RateLimiter>(async () => Promise.reject(new Error("down"))),
    });
    expect(await submitInquiryCore(form(), IP, d)).toEqual({ status: "error", code: 500 });
    expect(d.verifyTurnstile).not.toHaveBeenCalled();
    expect(d.save).not.toHaveBeenCalled();
  });
});

describe("formValues", () => {
  it("reads the checkbox as a boolean and ignores file entries", () => {
    const data = form({ consent: null });
    data.append("services", new Blob(["x"]));
    data.append("projectTypes", new Blob(["x"]));
    expect(formValues(data)).toMatchObject({
      consent: false,
      services: valid.services,
      projectTypes: valid.projectTypes,
    });
  });
});
