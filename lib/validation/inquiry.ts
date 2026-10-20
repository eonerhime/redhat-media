// The one definition of a valid inquiry (Phase 17 spec, D5–D8; Phase 19 spec, D3), used by the
// inquiry server action. The stepper's step checks use its Zod-free parts instead
// (inquiry-messages.ts, phone.ts, scope.ts; Phase 19 spec, D9). It never imports generated
// Prisma code; inquiry.test.ts proves the tuples below match the Prisma enums (D8). Relative
// imports only, like https-url.ts.

import { z } from "zod";
import { defaults } from "../../content/defaults.ts";
import { projectTypeIds } from "../../content/project-types.ts";
import { serviceCategories, services, type ServiceCategory } from "../../content/services.ts";
import { MESSAGES as M } from "./inquiry-messages.ts";
import { toE164 } from "./phone.ts";
import { projectTypeErrors } from "./scope.ts";

export { toE164 };

export const inquiryStatuses = ["NEW", "REVIEWING", "PROPOSAL_SENT", "CLOSED"] as const;

// Naira bands; their labels (with a USD hint) are Phase 19 copy (Phase 17 spec, D2).
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

/** An untouched input or `<select>` submits "": treat it as absent. */
const optional = <T extends z.ZodType>(schema: T) =>
  z
    .preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      schema.optional(),
    )
    .optional();

/** A required choice: blank means missing, anything else off the list means unknown. */
const choice = <const T extends readonly [string, ...string[]]>(
  values: T,
  missing: string,
  unknown: string,
) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.enum(values, { error: (issue) => (issue.input === undefined ? missing : unknown) }),
  );

// Service names as their default copy: a server message names the service (Appendix A).
const serviceName = (category: ServiceCategory) =>
  defaults[services.find((service) => service.category === category)!.nameKey];

const inquiryFields = z.object({
  clientName: z
    .string({ error: M.nameMissing })
    .trim()
    .min(2, M.nameMissing)
    .max(100, M.nameTooLong)
    .refine((value) => !NOT_ONE_LINE.test(value), M.nameOneLine),

  companyName: optional(
    z
      .string()
      .trim()
      .max(120, M.companyTooLong)
      .refine((value) => !NOT_ONE_LINE.test(value), M.companyOneLine),
  ),

  email: z
    .string({ error: M.emailInvalid })
    .trim()
    .max(254, M.emailTooLong)
    .pipe(z.email(M.emailInvalid)),

  phone: z
    .string({ error: M.phoneMissing })
    .trim()
    .min(1, M.phoneMissing)
    .max(32, M.phoneFormat)
    .transform((value, ctx) => {
      const e164 = toE164(value);
      if (e164) return e164;
      ctx.issues.push({ code: "custom", message: M.phoneFormat, input: value });
      return z.NEVER;
    }),

  services: z
    .array(z.enum(serviceCategories, M.servicesUnknown), {
      error: M.servicesMissing,
    })
    .min(1, M.servicesMissing)
    .max(serviceCategories.length, M.servicesRepeat)
    .refine((list) => new Set(list).size === list.length, M.servicesRepeat),

  // Ids are checked against the chosen services below (Phase 19 spec, D3).
  projectTypes: z
    .array(z.string(M.typesUnknown), { error: M.typesUnknown })
    .max(projectTypeIds.length, M.typesUnknown),

  // Required from Phase 19; "not sure" is an answer, so nobody has to guess (D3).
  budgetRange: choice(budgetRanges, M.budgetMissing, M.budgetUnknown),

  timeline: choice(inquiryTimelines, M.timelineMissing, M.timelineUnknown),

  projectNotes: z
    .string({ error: M.notesShort })
    .trim()
    .min(10, M.notesShort)
    .max(5000, M.notesTooLong)
    .refine((value) => !BAD_IN_NOTES.test(value), M.notesCharacters),

  consent: z.literal(true, M.consentMissing),
});

const scopeFields = inquiryFields.pick({ services: true, projectTypes: true });

export const inquiryInputSchema = inquiryFields.superRefine(
  (values, ctx) => {
    for (const { message } of projectTypeErrors(values.services, values.projectTypes, serviceName))
      ctx.addIssue({ code: "custom", path: ["projectTypes"], message });
  },
  // Runs whenever services and project types parse, whatever else is wrong.
  { when: (payload) => scopeFields.safeParse(payload.value).success },
);

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
    projectTypes: values.projectTypes,
    budgetRange: values.budgetRange,
    timeline: values.timeline,
    projectNotes: values.projectNotes,
    consentAt: now,
  };
}
