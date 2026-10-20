"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { buttonClassName } from "@/components/shared/button-link";
import {
  ELAPSED_FIELD,
  HONEYPOT_FIELD,
  IDLE,
  INQUIRY_FIELDS,
  TURNSTILE_ACTION,
  type InquiryField,
  type InquiryFieldErrors,
  type InquiryFormValues,
  type InquiryResult,
} from "@/lib/inquiry/fields";
import type { ServiceCategory } from "@/content/services";
import { contact, mailtoHref } from "@/lib/site";
import type { InquiryFormCopy } from "./inquiry-copy";

export type InquiryServiceOption = { category: ServiceCategory; name: string };

type Props = {
  action: (prev: InquiryResult, formData: FormData) => Promise<InquiryResult>;
  copy: InquiryFormCopy;
  /** visibleServices() at build time; the server re-checks at submit time (D8). */
  services: readonly InquiryServiceOption[];
  turnstileSiteKey: string;
};

const fieldId = (field: InquiryField) => `inquiry-${field}`;
const hintId = (field: InquiryField) => `inquiry-${field}-hint`;
const errorId = (field: InquiryField) => `inquiry-${field}-error`;

/** The ids an input's aria-describedby lists: its hint, then its error. */
const describedBy = (field: InquiryField, hasHint: boolean, errors: InquiryFieldErrors) =>
  [hasHint && hintId(field), errors[field] && errorId(field)].filter(Boolean).join(" ") ||
  undefined;

const control =
  "mt-2 block w-full rounded-md border border-line bg-ink px-4 py-3 text-lg text-fg aria-invalid:border-brand";
const textLink = "font-semibold underline decoration-brand decoration-2 underline-offset-4";

// Error text stays fg (brand on ink is under 4.5:1); the brand bar marks it (specs/tech-stack.md
// → Design tokens).
function FieldError({ field, errors }: { field: InquiryField; errors: InquiryFieldErrors }) {
  if (!errors[field]) return null;
  return (
    <p id={errorId(field)} className="mt-2 border-l-4 border-brand pl-3 text-base font-semibold">
      {errors[field]}
    </p>
  );
}

function Hint({ field, children }: { field: InquiryField; children: ReactNode }) {
  return (
    <p id={hintId(field)} className="mt-1 text-base text-muted">
      {children}
    </p>
  );
}

/** Copy with `{email}` becomes text around a mailto: link (Appendix A). */
function withEmail(text: string) {
  const [before, after = ""] = text.split("{email}");
  return (
    <>
      {before}
      <a href={mailtoHref()} className={textLink}>
        {contact.email}
      </a>
      {after}
    </>
  );
}

// The single-step inquiry form (Phase 18 spec, D2, D7, D9). Uncontrolled: React resets the form
// after each action, and `defaultValue`s from an `invalid` result put the visitor's input back.
export function InquiryForm({ action, copy, services, turnstileSiteKey }: Props) {
  const [result, dispatch, pending] = useActionState(action, IDLE);
  const openedAt = useRef<number | null>(null);
  const elapsed = useRef<HTMLInputElement>(null);
  const turnstile = useRef<TurnstileInstance>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);

  // D7: a duration on the device's monotonic clock, so it never depends on the server's.
  useEffect(() => {
    openedAt.current = performance.now();
  }, []);

  useEffect(() => {
    if (result.status === "idle") return;
    if (result.status === "success") {
      successHeading.current?.focus();
      return;
    }
    // A token is single-use, so the next attempt needs a fresh one (D5).
    turnstile.current?.reset();
    feedback.current?.focus();
  }, [result]);

  if (result.status === "success") {
    return (
      <div
        role="status"
        className="rounded-xl border border-t-4 border-line border-t-brand bg-ink p-6 md:p-8"
      >
        <h3
          ref={successHeading}
          tabIndex={-1}
          className="font-display text-2xl font-extrabold focus:outline-none"
        >
          {copy["success.heading"]}
        </h3>
        <p className="mt-4 text-lg">{copy["success.body"]}</p>
      </div>
    );
  }

  const errors: InquiryFieldErrors = result.status === "invalid" ? result.fieldErrors : {};
  const values: Partial<InquiryFormValues> = result.status === "invalid" ? result.values : {};
  const labels: Record<InquiryField, string> = {
    clientName: copy["name.label"],
    email: copy["email.label"],
    phone: copy["phone.label"],
    companyName: copy["company.label"],
    services: copy["services.legend"],
    projectNotes: copy["notes.label"],
    consent: copy["consent.link"],
  };
  const textInput = (
    field: InquiryField,
    props: React.InputHTMLAttributes<HTMLInputElement>,
    hint?: string,
  ) => (
    <div>
      <label htmlFor={fieldId(field)} className="font-semibold">
        {labels[field]}
      </label>
      {hint && <Hint field={field}>{hint}</Hint>}
      <input
        id={fieldId(field)}
        name={field}
        defaultValue={(values[field] as string | undefined) ?? ""}
        aria-invalid={errors[field] ? true : undefined}
        aria-describedby={describedBy(field, Boolean(hint), errors)}
        className={control}
        {...props}
      />
      <FieldError field={field} errors={errors} />
    </div>
  );

  return (
    <form
      action={dispatch}
      // React builds the FormData after onSubmit, so the duration set here is sent (D7).
      onSubmit={() => {
        if (elapsed.current && openedAt.current !== null) {
          elapsed.current.value = String(Math.round(performance.now() - openedAt.current));
        }
      }}
      className="relative flex flex-col gap-6"
    >
      <div ref={feedback} tabIndex={-1} className="focus:outline-none">
        {result.status === "invalid" && (
          <div className="rounded-xl border border-l-4 border-line border-l-brand p-6">
            <p className="font-semibold">{copy["errors.summary"]}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {INQUIRY_FIELDS.filter((field) => errors[field]).map((field) => (
                <li key={field}>
                  <a href={`#${fieldId(field)}`} className={textLink}>
                    {errors[field]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {(result.status === "rejected" ||
          result.status === "error" ||
          result.status === "unavailable" ||
          result.status === "rate_limited") && (
          <p className="rounded-xl border border-l-4 border-line border-l-brand p-6 font-semibold">
            {withEmail(
              copy[result.status === "rate_limited" ? "errors.rateLimited" : "errors.generic"],
            )}
          </p>
        )}
      </div>

      {textInput("clientName", {
        type: "text",
        required: true,
        minLength: 2,
        maxLength: 100,
        autoComplete: "name",
      })}
      {textInput("email", { type: "email", required: true, maxLength: 254, autoComplete: "email" })}
      {textInput(
        "phone",
        { type: "tel", required: true, maxLength: 32, autoComplete: "tel" },
        copy["phone.hint"],
      )}
      {textInput("companyName", { type: "text", maxLength: 120, autoComplete: "organization" })}

      <fieldset
        id={fieldId("services")}
        aria-invalid={errors.services ? true : undefined}
        aria-describedby={describedBy("services", true, errors)}
        tabIndex={-1}
        className="focus:outline-none"
      >
        <legend className="font-semibold">{copy["services.legend"]}</legend>
        <Hint field="services">{copy["services.hint"]}</Hint>
        <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
          {services.map(({ category, name }) => (
            <li key={category}>
              <label className="flex min-h-11 items-center gap-3 text-lg">
                <input
                  type="checkbox"
                  name="services"
                  value={category}
                  defaultChecked={values.services?.includes(category) ?? false}
                  className="size-5 shrink-0 accent-brand-deep"
                />
                {name}
              </label>
            </li>
          ))}
        </ul>
        <FieldError field="services" errors={errors} />
      </fieldset>

      <div>
        <label htmlFor={fieldId("projectNotes")} className="font-semibold">
          {labels.projectNotes}
        </label>
        <Hint field="projectNotes">{copy["notes.hint"]}</Hint>
        <textarea
          id={fieldId("projectNotes")}
          name="projectNotes"
          rows={6}
          required
          minLength={10}
          maxLength={5000}
          defaultValue={values.projectNotes ?? ""}
          aria-invalid={errors.projectNotes ? true : undefined}
          aria-describedby={describedBy("projectNotes", true, errors)}
          className={control}
        />
        <FieldError field="projectNotes" errors={errors} />
      </div>

      <div>
        <label className="flex items-start gap-3 text-lg">
          <input
            id={fieldId("consent")}
            type="checkbox"
            name="consent"
            required
            defaultChecked={values.consent ?? false}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={describedBy("consent", false, errors)}
            className="mt-1 size-5 shrink-0 accent-brand-deep"
          />
          <span>
            {copy["consent.label"]}{" "}
            <a href="/privacy" target="_blank" rel="noopener" className={textLink}>
              {copy["consent.link"]}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </span>
        </label>
        <FieldError field="consent" errors={errors} />
      </div>

      {/* D7: off-screen and hidden from assistive tech; any value means a bot filled it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor="inquiry-website">Website</label>
        <input
          id="inquiry-website"
          type="text"
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      <input ref={elapsed} type="hidden" name={ELAPSED_FIELD} defaultValue="" />

      <Turnstile
        ref={turnstile}
        siteKey={turnstileSiteKey}
        options={{
          action: TURNSTILE_ACTION,
          theme: "dark",
          size: "flexible",
          appearance: "interaction-only",
        }}
      />

      <div>
        <button
          type="submit"
          disabled={pending}
          className={`${buttonClassName} disabled:cursor-wait`}
        >
          {pending ? copy.submitting : copy.submit}
        </button>
      </div>
    </form>
  );
}
