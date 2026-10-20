// The inquiry form's copy (Phase 18 spec, Appendix A), read on the server and passed to the
// client form as plain strings. Kept out of inquiry-form.tsx: a "use client" module's exports
// reach server code only as client references.

import { block } from "@/lib/content/block";

export const INQUIRY_COPY_KEYS = [
  "name.label",
  "email.label",
  "phone.label",
  "phone.hint",
  "company.label",
  "services.legend",
  "services.hint",
  "notes.label",
  "notes.hint",
  "consent.label",
  "consent.link",
  "submit",
  "submitting",
  "errors.summary",
  "errors.generic",
  "errors.rateLimited",
  "success.heading",
  "success.body",
] as const;

export type InquiryCopyKey = (typeof INQUIRY_COPY_KEYS)[number];
export type InquiryFormCopy = Record<InquiryCopyKey, string>;

export async function inquiryFormCopy(): Promise<InquiryFormCopy> {
  const values = await Promise.all(INQUIRY_COPY_KEYS.map((key) => block(`contact.form.${key}`)));
  return Object.fromEntries(INQUIRY_COPY_KEYS.map((key, i) => [key, values[i]])) as InquiryFormCopy;
}
