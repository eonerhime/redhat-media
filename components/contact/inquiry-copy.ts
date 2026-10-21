// The inquiry form's copy (Phase 18 spec, Appendix A; Phase 19 spec, Appendices A and B), read
// on the server and passed to the client form as plain strings. Kept out of inquiry-form.tsx: a
// "use client" module's exports reach server code only as client references.

import { projectTypes } from "@/content/project-types";
import type { Service } from "@/content/services";
import { block, type BlockKey } from "@/lib/content/block";
import type { BudgetRange, InquiryTimeline } from "@/lib/validation/inquiry";

export const INQUIRY_COPY_KEYS = [
  "progress",
  "stepHeading",
  "steps.services",
  "steps.types",
  "steps.budget",
  "steps.timeline",
  "steps.details",
  "steps.review",
  "name.label",
  "email.label",
  "phone.label",
  "phone.hint",
  "company.label",
  "services.legend",
  "services.hint",
  "types.hint",
  "budget.legend",
  "budget.hint",
  "timeline.legend",
  "notes.label",
  "notes.hint",
  "review.intro",
  "review.services",
  "review.types",
  "review.budget",
  "review.timeline",
  "review.details",
  "review.change",
  "review.changeLabel",
  "consent.label",
  "consent.link",
  "next",
  "back",
  "toReview",
  "noscript",
  "submit",
  "submitting",
  "errors.summary",
  "errors.generic",
  "errors.rateLimited",
  "success.heading",
  "success.body",
  "success.ack",
] as const;

export type InquiryCopyKey = (typeof INQUIRY_COPY_KEYS)[number];
export type InquiryFormCopy = Record<InquiryCopyKey, string>;

export type InquiryChoice = { value: string; label: string };
export type InquiryChoices = { budgetRange: InquiryChoice[]; timeline: InquiryChoice[] };

// In Prisma enum order, which is the order shown (Phase 19 spec, D5).
export const BUDGET_KEYS = {
  UNDER_500K: "contact.form.budget.under500k",
  FROM_500K_TO_1_5M: "contact.form.budget.from500kTo1500k",
  FROM_1_5M_TO_5M: "contact.form.budget.from1500kTo5m",
  FROM_5M_TO_15M: "contact.form.budget.from5mTo15m",
  OVER_15M: "contact.form.budget.over15m",
  NOT_SURE: "contact.form.budget.notSure",
} as const satisfies Record<BudgetRange, BlockKey>;

export const TIMELINE_KEYS = {
  ASAP: "contact.form.timeline.asap",
  WITHIN_1_MONTH: "contact.form.timeline.within1Month",
  ONE_TO_THREE_MONTHS: "contact.form.timeline.oneToThreeMonths",
  OVER_THREE_MONTHS: "contact.form.timeline.overThreeMonths",
  FLEXIBLE: "contact.form.timeline.flexible",
} as const satisfies Record<InquiryTimeline, BlockKey>;

const options = (keys: Record<string, BlockKey>) =>
  Promise.all(
    Object.entries(keys).map(async ([value, key]) => ({ value, label: await block(key) })),
  );

export async function inquiryFormCopy(): Promise<InquiryFormCopy> {
  const values = await Promise.all(INQUIRY_COPY_KEYS.map((key) => block(`contact.form.${key}`)));
  return Object.fromEntries(INQUIRY_COPY_KEYS.map((key, i) => [key, values[i]])) as InquiryFormCopy;
}

export async function inquiryChoices(): Promise<InquiryChoices> {
  const [budgetRange, timeline] = await Promise.all([options(BUDGET_KEYS), options(TIMELINE_KEYS)]);
  return { budgetRange, timeline };
}

/** A visible service with its project types, for the first two steps (D5). */
export async function inquiryServiceOption(service: Service) {
  const [name, types] = await Promise.all([
    block(service.nameKey),
    Promise.all(
      projectTypes[service.category].map(async (type) => ({
        id: type.id,
        label: await block(type.labelKey),
      })),
    ),
  ]);
  return { category: service.category, name, types };
}
