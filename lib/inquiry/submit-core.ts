// The inquiry form's submit logic (Phase 18 spec, D3–D8; Phase 19 spec, D4). The server action in
// app/(public)/contact/actions.ts reads the client IP and passes the real
// dependencies; tests pass fakes, so every path runs without a network or database.

import type { ServiceCategory } from "../../content/services";
import type { RateLimiter } from "@/lib/security/rate-limit-core";
import type { TurnstileVerifier } from "@/lib/security/turnstile-core";
import { UNKNOWN_IP } from "@/lib/security/client-ip";
import { inquiryInputSchema, toInquiryData } from "@/lib/validation/inquiry";
import {
  ELAPSED_FIELD,
  HONEYPOT_FIELD,
  INQUIRY_FIELDS,
  TURNSTILE_ACTION,
  TURNSTILE_FIELD,
  type InquiryFieldErrors,
  type InquiryFormValues,
  type InquiryResult,
} from "./fields";

/** Faster than this from hydration to submit is a bot (D7). */
export const MIN_FILL_MS = 3000;
/** Longer than this is not a duration a browser tab reports for one visit (D7). */
export const MAX_FILL_MS = 86_400_000;

// D6: 5 per 10 minutes, then 20 per day, per IP.
export const RATE_LIMITS = [
  { bucket: "inquiry", max: 5, windowSec: 600 },
  { bucket: "inquiry.day", max: 20, windowSec: 86_400 },
] as const;

export const MUTED_SERVICE_ERROR = "Choose services from the list.";

export type InquiryData = ReturnType<typeof toInquiryData>;

export type SubmitDeps = {
  /** `INQUIRY_FORM_ENABLED=1`, read at submit time (D10). */
  enabled: boolean;
  now: () => Date;
  rateLimit: RateLimiter;
  verifyTurnstile: TurnstileVerifier;
  /** Categories visible at submit time, so a service muted since the build is refused (D8). */
  visibleCategories: () => Promise<readonly ServiceCategory[]>;
  save: (data: InquiryData) => Promise<void>;
  logError?: (message: string, error: unknown) => void;
};

const text = (formData: FormData, name: string): string => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

const list = (formData: FormData, name: string): string[] =>
  formData.getAll(name).filter((value) => typeof value === "string");

/** The D2 fields as submitted, echoed back on `invalid` (D4). Never the honeypot, time or token. */
export function formValues(formData: FormData): InquiryFormValues {
  return {
    services: list(formData, "services"),
    projectTypes: list(formData, "projectTypes"),
    budgetRange: text(formData, "budgetRange"),
    timeline: text(formData, "timeline"),
    clientName: text(formData, "clientName"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    companyName: text(formData, "companyName"),
    projectNotes: text(formData, "projectNotes"),
    consent: formData.get("consent") !== null,
  };
}

/**
 * D7: the honeypot is empty and the form was open 3 seconds to 24 hours. A duration
 * measured on the device, so the visitor's clock never has to agree with the server's.
 */
function looksHuman(formData: FormData): boolean {
  if (text(formData, HONEYPOT_FIELD) !== "") return false;
  const elapsed = text(formData, ELAPSED_FIELD);
  if (!/^\d{1,9}$/.test(elapsed)) return false;
  const ms = Number(elapsed);
  return ms >= MIN_FILL_MS && ms <= MAX_FILL_MS;
}

const invalid = (fieldErrors: InquiryFieldErrors, values: InquiryFormValues): InquiryResult => ({
  status: "invalid",
  code: 400,
  fieldErrors,
  values,
});

/**
 * Runs the D3 checks in order and saves a valid, human, in-limit inquiry.
 *
 * @example const result = await submitInquiryCore(formData, clientIp(await headers()), deps);
 */
export async function submitInquiryCore(
  formData: FormData,
  ip: string,
  deps: SubmitDeps,
): Promise<InquiryResult> {
  const logError = deps.logError ?? ((message, error) => console.error(message, error));

  if (!deps.enabled) return { status: "unavailable", code: 503 };

  if (!looksHuman(formData)) return { status: "rejected", code: 403 };

  const values = formValues(formData);
  const parsed = inquiryInputSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: InquiryFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = INQUIRY_FIELDS.find((name) => name === issue.path[0]);
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return invalid(fieldErrors, values);
  }

  try {
    // A muted service's project types go with it: types must belong to a chosen service (D4).
    const visible = new Set(await deps.visibleCategories());
    if (!parsed.data.services.every((category) => visible.has(category))) {
      return invalid({ services: MUTED_SERVICE_ERROR }, values);
    }

    for (const { bucket, max, windowSec } of RATE_LIMITS) {
      const { allowed } = await deps.rateLimit(bucket, ip, { max, windowSec });
      if (!allowed) return { status: "rate_limited", code: 429 };
    }

    const remoteIp = ip === UNKNOWN_IP ? undefined : ip;
    const token = text(formData, TURNSTILE_FIELD);
    if (!(await deps.verifyTurnstile(token, remoteIp, TURNSTILE_ACTION))) {
      return { status: "rejected", code: 403 };
    }

    await deps.save(toInquiryData(parsed.data, deps.now()));
    return { status: "success", code: 201 };
  } catch (error) {
    // The database (limiter or save) is down: fail closed; the form offers email (D9).
    logError("[inquiry] submit failed", error);
    return { status: "error", code: 500 };
  }
}
