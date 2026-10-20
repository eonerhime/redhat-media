// The one definition of a valid inquiry (Phase 17 spec, D5–D8), shared by the
// Phase 18 form and its server action. It never imports generated Prisma code,
// so it stays light in the client bundle; inquiry.test.ts proves the tuples
// below match the Prisma enums (D8). Relative imports only, like https-url.ts.

import { z } from "zod";
import { serviceCategories } from "../../content/services.ts";

export const inquiryStatuses = ["NEW", "REVIEWING", "PROPOSAL_SENT", "CLOSED"] as const;

// Naira bands; their labels (with a USD hint) are Phase 19 copy (D2).
export const budgetRanges = [
  "UNDER_500K",
  "FROM_500K_TO_1_5M",
  "FROM_1_5M_TO_5M",
  "FROM_5M_TO_15M",
  "OVER_15M",
  "NOT_SURE",
] as const;

export const inquiryTimelines = [
  "ASAP",
  "WITHIN_1_MONTH",
  "ONE_TO_THREE_MONTHS",
  "OVER_THREE_MONTHS",
  "FLEXIBLE",
] as const;

export type BudgetRange = (typeof budgetRanges)[number];
export type InquiryTimeline = (typeof inquiryTimelines)[number];

// Control characters (C0 and C1) and the Unicode line and paragraph
// separators. Notes may keep tabs and line breaks; single-line fields keep none.
const NOT_ONE_LINE = /[\p{Cc}\p{Zl}\p{Zp}]/u;
const BAD_IN_NOTES = /[^\P{Cc}\t\n\r]/u;

const PHONE_CHARS = /^\+?[\d\s().-]+$/;

/**
 * Normalises a phone number to E.164 (D6), or returns null. Accepts a Nigerian
 * local number (`0803 123 4567`), `234…` without the plus, and any `+` number
 * of 8 to 15 digits. A `+234` number must have 10 digits after the country
 * code; the trunk `0` often written after it (`+234 (0)803…`) is dropped.
 */
export function toE164(input: string): string | null {
  if (!PHONE_CHARS.test(input)) return null;
  let digits = input.replace(/\D/g, "");

  if (!input.startsWith("+")) {
    if (/^0\d{10}$/.test(digits)) return `+234${digits.slice(1)}`;
    if (/^234\d{10}$/.test(digits)) return `+${digits}`;
    return null;
  }

  if (digits.startsWith("2340")) digits = `234${digits.slice(4)}`;
  if (digits.startsWith("234")) return /^234\d{10}$/.test(digits) ? `+${digits}` : null;
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
}

/** An untouched input or `<select>` submits "": treat it as absent. */
const optional = <T extends z.ZodType>(schema: T) =>
  z
    .preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      schema.optional(),
    )
    .optional();

const PHONE_MISSING = "Enter a phone number we can reach you on.";
const PHONE_FORMAT =
  "Enter a phone number like 0803 123 4567, or with a country code like +44 20 7946 0000.";
const EMAIL_INVALID = "Enter a valid email address, like name@example.com.";
const NOTES_SHORT = "Tell us a little about your project (at least 10 characters).";

export const inquiryInputSchema = z.object({
  clientName: z
    .string({ error: "Enter your name." })
    .trim()
    .min(2, "Enter your name.")
    .max(100, "Your name must be at most 100 characters.")
    .refine((value) => !NOT_ONE_LINE.test(value), "Your name must be on one line."),

  companyName: optional(
    z
      .string()
      .trim()
      .max(120, "Company name must be at most 120 characters.")
      .refine((value) => !NOT_ONE_LINE.test(value), "Company name must be on one line."),
  ),

  email: z
    .string({ error: EMAIL_INVALID })
    .trim()
    .max(254, "Email addresses must be at most 254 characters.")
    .pipe(z.email(EMAIL_INVALID)),

  phone: z
    .string({ error: PHONE_MISSING })
    .trim()
    .min(1, PHONE_MISSING)
    .max(32, PHONE_FORMAT)
    .transform((value, ctx) => {
      const e164 = toE164(value);
      if (e164) return e164;
      ctx.issues.push({ code: "custom", message: PHONE_FORMAT, input: value });
      return z.NEVER;
    }),

  services: z
    .array(z.enum(serviceCategories, "Choose services from the list."), {
      error: "Choose at least one service.",
    })
    .min(1, "Choose at least one service.")
    .max(serviceCategories.length, "Choose each service only once.")
    .refine((list) => new Set(list).size === list.length, "Choose each service only once."),

  budgetRange: optional(z.enum(budgetRanges, "Choose a budget range from the list.")),

  timeline: optional(z.enum(inquiryTimelines, "Choose a timeline from the list.")),

  projectNotes: z
    .string({ error: NOTES_SHORT })
    .trim()
    .min(10, NOTES_SHORT)
    .max(5000, "Project details must be at most 5,000 characters.")
    .refine(
      (value) => !BAD_IN_NOTES.test(value),
      "Project details contain characters we can't accept.",
    ),

  consent: z.literal(true, "Please agree to the privacy notice so we can keep your details."),
});

/** What the form submits (Phase 18 builds it from FormData). */
export type InquiryInput = z.input<typeof inquiryInputSchema>;
/** Parsed, trimmed and normalised values. */
export type InquiryValues = z.output<typeof inquiryInputSchema>;

/**
 * The database row for a parsed inquiry (D7). Lists every field explicitly, so
 * `id`, `status`, `emailSentAt`, `ackSentAt` and the timestamps always take
 * their database defaults, and consent is stamped with the server's clock.
 */
export function toInquiryData(values: InquiryValues, now: Date) {
  return {
    clientName: values.clientName,
    companyName: values.companyName ?? null,
    email: values.email,
    phone: values.phone,
    services: values.services,
    budgetRange: values.budgetRange ?? null,
    timeline: values.timeline ?? null,
    projectNotes: values.projectNotes,
    consentAt: now,
  };
}
