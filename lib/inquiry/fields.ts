// What the inquiry form posts and what the action answers (Phase 18 spec, D2–D4,
// D7; Phase 19 spec, D4). Shared by the client form and lib/inquiry/submit-core.ts, so it imports
// nothing.

/** Hidden from people; any value means a bot filled it (D7). */
export const HONEYPOT_FIELD = "website";
/** Milliseconds the form was open, from `performance.now()`; set just before submit (D7). */
export const ELAPSED_FIELD = "elapsedMs";
/** The widget's hidden input (D5). */
export const TURNSTILE_FIELD = "cf-turnstile-response";
/** The `action` the widget is rendered with and the server expects back (D5). */
export const TURNSTILE_ACTION = "inquiry";

/** The fields a person fills in, in step order; echoed back on `invalid` (D4). */
export const INQUIRY_FIELDS = [
  "services",
  "projectTypes",
  "budgetRange",
  "timeline",
  "clientName",
  "email",
  "phone",
  "companyName",
  "projectNotes",
  "consent",
] as const;

export type InquiryField = (typeof INQUIRY_FIELDS)[number];

export type InquiryFormValues = {
  services: string[];
  projectTypes: string[];
  budgetRange: string;
  timeline: string;
  clientName: string;
  email: string;
  phone: string;
  companyName: string;
  projectNotes: string;
  consent: boolean;
};

/** One message per field, the first the schema reports. */
export type InquiryFieldErrors = Partial<Record<InquiryField, string>>;

/**
 * Server actions always answer HTTP 200, so the outcome carries an HTTP-like
 * `code` (D4).
 */
export type InquiryResult =
  | { status: "idle" }
  | { status: "success"; code: 201 }
  | { status: "invalid"; code: 400; fieldErrors: InquiryFieldErrors; values: InquiryFormValues }
  | { status: "rejected"; code: 403 }
  | { status: "rate_limited"; code: 429 }
  | { status: "unavailable"; code: 503 }
  | { status: "error"; code: 500 };

export const IDLE: InquiryResult = { status: "idle" };
