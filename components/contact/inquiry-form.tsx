"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { buttonClassName } from "@/components/shared/button-link";
import { isNotSure } from "@/content/project-types";
import type { ServiceCategory } from "@/content/services";
import {
  ELAPSED_FIELD,
  HONEYPOT_FIELD,
  IDLE,
  TURNSTILE_ACTION,
  type InquiryResult,
} from "@/lib/inquiry/fields";
import { contact, mailtoHref } from "@/lib/site";
import { MESSAGES } from "@/lib/validation/inquiry-messages";
import { toE164 } from "@/lib/validation/phone";
import { projectTypeErrors } from "@/lib/validation/scope";
import type { InquiryChoice, InquiryChoices, InquiryFormCopy } from "./inquiry-copy";

export type InquiryServiceOption = {
  category: ServiceCategory;
  name: string;
  types: readonly { id: string; label: string }[];
};

type Props = {
  action: (prev: InquiryResult, formData: FormData) => Promise<InquiryResult>;
  copy: InquiryFormCopy;
  choices: InquiryChoices;
  /** visibleServices() at build time; the server re-checks at submit time (Phase 18 spec, D8). */
  services: readonly InquiryServiceOption[];
  turnstileSiteKey: string;
};

// The six steps, in order (Phase 19 spec, D5).
const STEPS = ["services", "types", "budget", "timeline", "details", "review"] as const;
type Step = (typeof STEPS)[number];
const LAST = STEPS.length - 1;

// An error's key is a field name, or `projectTypes-<CATEGORY>` for one service's types (D9).
type Errors = Partial<Record<string, string>>;

const DETAIL_FIELDS = ["clientName", "email", "phone", "companyName", "projectNotes"];

/** The step that shows a field's error (D9). */
function stepOf(key: string): number {
  if (key === "services") return 0;
  if (key.startsWith("projectTypes")) return 1;
  if (key === "budgetRange") return 2;
  if (key === "timeline") return 3;
  if (DETAIL_FIELDS.includes(key)) return 4;
  return LAST;
}

/** The first step showing one of `errors`; the last when there are none. */
const firstStepWithError = (errors: Errors) => Math.min(LAST, ...Object.keys(errors).map(stepOf));

const fieldId = (key: string) => `inquiry-${key}`;
const hintId = (key: string) => `inquiry-${key}-hint`;
const errorId = (key: string) => `inquiry-${key}-error`;
const headingId = (step: number) => `inquiry-step-${step}`;
const summaryId = (step: number) => `inquiry-step-${step}-summary`;

/** The ids an input's aria-describedby lists: its hint, then its error. */
const describedBy = (key: string, hasHint: boolean, errors: Errors) =>
  [hasHint && hintId(key), errors[key] && errorId(key)].filter(Boolean).join(" ") || undefined;

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));

/** A label without its required marker, for the review (Appendix A). */
const bare = (label: string) => label.replace(/\s*\*$/, "");

const control =
  "mt-2 block w-full rounded-md border border-line bg-ink px-4 py-3 text-lg text-fg aria-invalid:border-brand";
const textLink = "font-semibold underline decoration-brand decoration-2 underline-offset-4";
const secondaryButton =
  "inline-flex items-center rounded-md border border-line px-6 py-3 font-semibold text-fg hover:border-fg";
const choiceLabel = "flex min-h-11 items-center gap-3 text-lg";
const box = "size-5 shrink-0 accent-brand-deep";

// Error text stays fg (brand on ink is under 4.5:1); the brand bar marks it (specs/tech-stack.md
// → Design tokens).
function FieldError({ id, errors }: { id: string; errors: Errors }) {
  if (!errors[id]) return null;
  return (
    <p id={errorId(id)} className="mt-2 border-l-4 border-brand pl-3 text-base font-semibold">
      {errors[id]}
    </p>
  );
}

function Hint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={hintId(id)} className="mt-1 text-base text-muted">
      {children}
    </p>
  );
}

/** Copy with `{email}` becomes text around a mailto: link (Phase 18 spec, Appendix A). */
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

/** What the review step shows, read from the form when it opens (D5). */
type Review = {
  services: string[];
  types: { service: string; labels: string[] }[];
  budgetRange: string;
  timeline: string;
  details: { label: string; value: string }[];
};

// The scope stepper (Phase 19 spec, D5–D11). One uncontrolled form with every step in the DOM;
// steps other than the current one are `hidden`, so answers survive moving back and forth (D6).
// It submits through startTransition rather than `action`, so React never resets the answers
// after a failed send.
export function InquiryForm({ action, copy, choices, services, turnstileSiteKey }: Props) {
  const [result, dispatch, pending] = useActionState(action, IDLE);
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [errors, setErrors] = useState<Errors>({});
  const [review, setReview] = useState<Review | null>(null);
  // D8: what to focus after the next render; the nonce makes a repeat target count.
  const [focus, setFocus] = useState<{ id: string; nonce: number } | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const openedAt = useRef<number | null>(null);
  const elapsed = useRef<HTMLInputElement>(null);
  const turnstile = useRef<TurnstileInstance>(null);
  const succeeded = result.status === "success";

  const total = STEPS.length;
  const stepNames: Record<Step, string> = {
    services: copy["steps.services"],
    types: copy["steps.types"],
    budget: copy["steps.budget"],
    timeline: copy["steps.timeline"],
    details: copy["steps.details"],
    review: copy["steps.review"],
  };
  const nameOf = (category: ServiceCategory) =>
    services.find((service) => service.category === category)?.name ?? category;

  const focusOn = (id: string) => setFocus({ id, nonce: Math.random() });

  /** The review's answers, read from the form (disabled types are not in its FormData). */
  function readReview(element: HTMLFormElement): Review {
    const data = new FormData(element);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    const picked = new Set(data.getAll("projectTypes"));
    const label = (list: InquiryChoice[], value: string) =>
      list.find((option) => option.value === value)?.label ?? "";
    const visible = services.filter((service) =>
      data.getAll("services").includes(service.category),
    );
    return {
      services: visible.map((service) => service.name),
      types: visible.map((service) => ({
        service: service.name,
        labels: service.types.filter((type) => picked.has(type.id)).map((type) => type.label),
      })),
      budgetRange: label(choices.budgetRange, text("budgetRange")),
      timeline: label(choices.timeline, text("timeline")),
      details: [
        { label: bare(copy["name.label"]), value: text("clientName") },
        { label: bare(copy["email.label"]), value: text("email") },
        { label: bare(copy["phone.label"]), value: text("phone") },
        { label: bare(copy["company.label"]), value: text("companyName") },
        { label: bare(copy["notes.label"]), value: text("projectNotes") },
      ].filter((item) => item.value !== ""),
    };
  }

  /** D9: one step's checks, with the server's messages and no Zod. */
  function check(index: number, element: HTMLFormElement): Errors {
    const data = new FormData(element);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    const found: Errors = {};
    switch (STEPS[index]) {
      case "services":
        if (data.getAll("services").length === 0) found.services = MESSAGES.servicesMissing;
        break;
      case "types": {
        const categories = services
          .map((service) => service.category)
          .filter((category) => data.getAll("services").includes(category));
        const types = data.getAll("projectTypes").map(String);
        for (const { category, message } of projectTypeErrors(categories, types, nameOf)) {
          const key = category ? `projectTypes-${category}` : "projectTypes";
          found[key] ??= message;
        }
        break;
      }
      case "budget":
        if (!text("budgetRange")) found.budgetRange = MESSAGES.budgetMissing;
        break;
      case "timeline":
        if (!text("timeline")) found.timeline = MESSAGES.timelineMissing;
        break;
      case "details": {
        const email = element.elements.namedItem("email") as HTMLInputElement;
        const phone = text("phone");
        if (text("clientName").length < 2) found.clientName = MESSAGES.nameMissing;
        if (!text("email") || email.validity.typeMismatch) found.email = MESSAGES.emailInvalid;
        if (!phone) found.phone = MESSAGES.phoneMissing;
        else if (!toE164(phone)) found.phone = MESSAGES.phoneFormat;
        if (text("projectNotes").length < 10) found.projectNotes = MESSAGES.notesShort;
        break;
      }
      case "review":
        if (!data.get("consent")) found.consent = MESSAGES.consentMissing;
        break;
    }
    return found;
  }

  /** Replaces one step's errors with `found`, leaving the other steps' (D9). */
  const withStepErrors = (current: Errors, index: number, found: Errors) => ({
    ...Object.fromEntries(Object.entries(current).filter(([key]) => stepOf(key) !== index)),
    ...found,
  });

  /** Shows a step and adds a history entry for it, so browser Back returns here (D7). */
  function show(index: number, target: "heading" | "summary" = "heading") {
    if (index === LAST && form.current) setReview(readReview(form.current));
    setStep(index);
    window.history.pushState({ inquiryStep: index }, "");
    focusOn(target === "summary" ? summaryId(index) : headingId(index));
  }

  function next() {
    if (!form.current) return;
    const found = check(step, form.current);
    setErrors((current) => withStepErrors(current, step, found));
    if (Object.keys(found).length > 0) {
      focusOn(summaryId(step));
      return;
    }
    show(step + 1);
  }

  // D7: the in-form Back and the browser's behave the same.
  function back() {
    if (typeof window.history.state?.inquiryStep === "number") window.history.back();
    else show(Math.max(0, step - 1));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    // Implicit submission (Enter in a field) on an earlier step means Continue.
    if (step !== LAST) {
      next();
      return;
    }
    // Every step again: browser Forward can skip a step's Continue.
    let all: Errors = {};
    for (let index = 0; index <= LAST; index++) all = { ...all, ...check(index, element) };
    setErrors(all);
    if (Object.keys(all).length > 0) {
      const first = firstStepWithError(all);
      if (first === LAST) focusOn(summaryId(LAST));
      else show(first, "summary");
      return;
    }
    // Phase 18 spec, D7: a duration on the device's monotonic clock.
    if (elapsed.current && openedAt.current !== null) {
      elapsed.current.value = String(Math.round(performance.now() - openedAt.current));
    }
    const data = new FormData(element);
    startTransition(() => dispatch(data));
  }

  /** "Not sure yet" stands alone in its service (D1). */
  function onTypeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    if (!input.checked) return;
    const group = input.closest("fieldset");
    for (const other of group?.querySelectorAll<HTMLInputElement>('input[name="projectTypes"]') ??
      []) {
      if (other !== input && (isNotSure(input.value) || isNotSure(other.value)))
        other.checked = false;
    }
  }

  /** A review group's Change button returns to its step (D5). */
  function onChangeStep(event: React.MouseEvent<HTMLButtonElement>) {
    show(Number(event.currentTarget.dataset.step));
  }

  function onServiceChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { value, checked } = event.currentTarget;
    setChosen((current) => {
      const updated = new Set(current);
      if (checked) updated.add(value);
      else updated.delete(value);
      return updated;
    });
  }

  // Phase 18 spec, D7: the open time, on the device's monotonic clock. A browser that restored
  // ticked services (reload, back-forward cache) gets their project types shown (D6).
  useEffect(() => {
    openedAt.current = performance.now();
    const ticked = form.current?.querySelectorAll<HTMLInputElement>(
      'input[name="services"]:checked',
    );
    if (ticked?.length) setChosen(new Set(Array.from(ticked, (input) => input.value)));
  }, []);

  // D7: browser Back and Forward move between steps. After success the panel replaces the form,
  // so they change nothing.
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const index = (event.state as { inquiryStep?: unknown } | null)?.inquiryStep;
      const target = typeof index === "number" && index >= 0 && index <= LAST ? index : 0;
      if (target === LAST && form.current) setReview(readReview(form.current));
      setStep(target);
      focusOn(headingId(target));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // readReview reads only props and the form; the listener is set up once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (focus) document.getElementById(focus.id)?.focus();
  }, [focus]);

  // D9: a server `invalid` replaces the client's messages and opens the first step with one.
  // The state follows the result during render; the effect below does the DOM work.
  const [handled, setHandled] = useState<InquiryResult>(IDLE);
  if (result !== handled) {
    setHandled(result);
    if (result.status === "invalid") {
      setErrors(result.fieldErrors);
      setStep(firstStepWithError(result.fieldErrors));
    }
  }

  useEffect(() => {
    if (result.status === "idle" || result.status === "success") return;
    // A token is single-use, so the next attempt needs a fresh one (Phase 18 spec, D5).
    turnstile.current?.reset();
    if (result.status !== "invalid") {
      document.getElementById("inquiry-feedback")?.focus();
      return;
    }
    // A history entry, as for any other step change, so Back returns to the review (D7).
    const first = firstStepWithError(result.fieldErrors);
    if (first !== LAST) window.history.pushState({ inquiryStep: first }, "");
    document.getElementById(summaryId(first))?.focus();
  }, [result]);

  const successHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (succeeded) successHeading.current?.focus();
  }, [succeeded]);

  if (succeeded) {
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
        {/* Phase 20 spec, D13: promised only when the acknowledgment will be attempted. */}
        {result.acknowledgment && <p className="mt-2 text-lg">{copy["success.ack"]}</p>}
      </div>
    );
  }

  // The order a step's summary lists its errors in.
  const errorOrder = [
    "services",
    "projectTypes",
    ...services.map((service) => `projectTypes-${service.category}`),
    "budgetRange",
    "timeline",
    ...DETAIL_FIELDS,
    "consent",
  ];
  const labels: Record<string, string> = {
    clientName: copy["name.label"],
    email: copy["email.label"],
    phone: copy["phone.label"],
    companyName: copy["company.label"],
    projectNotes: copy["notes.label"],
  };

  // Render helpers, not components: a component declared here would remount each render and
  // drop the uncontrolled answers (D6).
  const summary = (index: number) => {
    const keys = errorOrder.filter((key) => errors[key] && stepOf(key) === index);
    return (
      <div id={summaryId(index)} tabIndex={-1} className="empty:hidden focus:outline-none">
        {keys.length > 0 && (
          <div className="rounded-xl border border-l-4 border-line border-l-brand p-6">
            <p className="font-semibold">{copy["errors.summary"]}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {keys.map((key) => (
                <li key={key}>
                  <a href={`#${fieldId(key)}`} className={textLink}>
                    {errors[key]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const stepSection = (index: number, children: ReactNode) => (
    <section
      aria-labelledby={headingId(index)}
      hidden={step !== index}
      className="flex flex-col gap-6"
    >
      <h3
        id={headingId(index)}
        tabIndex={-1}
        className="font-display text-2xl font-extrabold focus:outline-none"
      >
        {fill(copy.stepHeading, { n: index + 1, total, step: stepNames[STEPS[index]] })}
      </h3>
      {summary(index)}
      {children}
    </section>
  );

  const nav = (index: number) =>
    index < LAST && (
      <div className="flex flex-wrap gap-4">
        {index > 0 && (
          <button type="button" onClick={back} className={secondaryButton}>
            {copy.back}
          </button>
        )}
        <button type="button" onClick={next} className={buttonClassName}>
          {copy.next}
        </button>
      </div>
    );

  const textInput = (
    field: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
    hint?: string,
  ) => (
    <div>
      <label htmlFor={fieldId(field)} className="font-semibold">
        {labels[field]}
      </label>
      {hint && <Hint id={field}>{hint}</Hint>}
      <input
        id={fieldId(field)}
        name={field}
        defaultValue=""
        aria-invalid={errors[field] ? true : undefined}
        aria-describedby={describedBy(field, Boolean(hint), errors)}
        className={control}
        {...props}
      />
      <FieldError id={field} errors={errors} />
    </div>
  );

  const radioGroup = (
    field: "budgetRange" | "timeline",
    legend: string,
    options: InquiryChoice[],
    hint?: string,
  ) => (
    // aria-required, not native `required`: an unchecked required radio is :invalid, which screen
    // readers announce as "invalid entry" before anything is chosen. The step check covers it (D9).
    <fieldset
      id={fieldId(field)}
      role="radiogroup"
      tabIndex={-1}
      aria-required="true"
      aria-invalid={errors[field] ? true : undefined}
      aria-describedby={describedBy(field, Boolean(hint), errors)}
      className="focus:outline-none"
    >
      <legend className="font-semibold">{legend}</legend>
      {hint && <Hint id={field}>{hint}</Hint>}
      <ul className="mt-3 grid gap-x-6">
        {options.map((option) => (
          <li key={option.value}>
            <label className={choiceLabel}>
              <input type="radio" name={field} value={option.value} className={box} />
              {option.label}
            </label>
          </li>
        ))}
      </ul>
      <FieldError id={field} errors={errors} />
    </fieldset>
  );

  // "Change Budget": the group's label names the step, so each button's name is unique.
  const reviewGroup = (label: string, index: number, body: ReactNode) => (
    <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:gap-6">
      <dt className="font-semibold sm:w-40 sm:shrink-0">{label}</dt>
      <dd className="grow text-lg">{body}</dd>
      <dd>
        <button
          type="button"
          data-step={index}
          onClick={onChangeStep}
          aria-label={fill(copy["review.changeLabel"], { step: label })}
          className={textLink}
        >
          {copy["review.change"]}
        </button>
      </dd>
    </div>
  );

  return (
    <form ref={form} noValidate onSubmit={submit} className="relative flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p id="inquiry-progress" className="font-semibold text-muted">
          {fill(copy.progress, { n: step + 1, total })}
        </p>
        <ol className="grid grid-cols-2 gap-x-4 gap-y-1 text-base text-muted sm:flex sm:flex-wrap">
          {STEPS.map((name, index) => (
            <li
              key={name}
              aria-current={index === step ? "step" : undefined}
              className="aria-[current=step]:font-semibold aria-[current=step]:text-fg aria-[current=step]:underline aria-[current=step]:decoration-brand aria-[current=step]:decoration-2 aria-[current=step]:underline-offset-4"
            >
              {`${index + 1}. ${stepNames[name]}`}
            </li>
          ))}
        </ol>
      </div>

      <noscript>
        <p className="rounded-xl border border-l-4 border-line border-l-brand p-6 font-semibold">
          {withEmail(copy.noscript)}
        </p>
      </noscript>

      {stepSection(
        0,
        <>
          <fieldset
            id={fieldId("services")}
            aria-invalid={errors.services ? true : undefined}
            aria-describedby={describedBy("services", true, errors)}
            tabIndex={-1}
            className="focus:outline-none"
          >
            <legend className="font-semibold">{copy["services.legend"]}</legend>
            <Hint id="services">{copy["services.hint"]}</Hint>
            <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
              {services.map(({ category, name }) => (
                <li key={category}>
                  <label className={choiceLabel}>
                    <input
                      type="checkbox"
                      name="services"
                      value={category}
                      onChange={onServiceChange}
                      className={box}
                    />
                    {name}
                  </label>
                </li>
              ))}
            </ul>
            <FieldError id="services" errors={errors} />
          </fieldset>
          {nav(0)}
        </>,
      )}

      {stepSection(
        1,
        <>
          <div
            id={fieldId("projectTypes")}
            tabIndex={-1}
            className="flex flex-col gap-6 focus:outline-none"
          >
            <Hint id="projectTypes">{copy["types.hint"]}</Hint>
            <FieldError id="projectTypes" errors={errors} />
            {/* D6: an unticked service's types stay in the form, disabled, so they are not sent. */}
            {services.map(({ category, name, types }) => {
              const key = `projectTypes-${category}`;
              const on = chosen.has(category);
              return (
                <fieldset
                  key={category}
                  id={fieldId(key)}
                  hidden={!on}
                  disabled={!on}
                  tabIndex={-1}
                  aria-invalid={errors[key] ? true : undefined}
                  aria-describedby={describedBy(key, false, errors)}
                  className="focus:outline-none"
                >
                  <legend className="font-semibold">{name}</legend>
                  <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
                    {types.map((type) => (
                      <li key={type.id}>
                        <label className={choiceLabel}>
                          <input
                            type="checkbox"
                            name="projectTypes"
                            value={type.id}
                            onChange={onTypeChange}
                            className={box}
                          />
                          {type.label}
                        </label>
                      </li>
                    ))}
                  </ul>
                  <FieldError id={key} errors={errors} />
                </fieldset>
              );
            })}
          </div>
          {nav(1)}
        </>,
      )}

      {stepSection(
        2,
        <>
          {radioGroup(
            "budgetRange",
            copy["budget.legend"],
            choices.budgetRange,
            copy["budget.hint"],
          )}
          {nav(2)}
        </>,
      )}

      {stepSection(
        3,
        <>
          {radioGroup("timeline", copy["timeline.legend"], choices.timeline)}
          {nav(3)}
        </>,
      )}

      {stepSection(
        4,
        <>
          {textInput("clientName", {
            type: "text",
            required: true,
            minLength: 2,
            maxLength: 100,
            autoComplete: "name",
          })}
          {textInput("email", {
            type: "email",
            required: true,
            maxLength: 254,
            autoComplete: "email",
          })}
          {textInput(
            "phone",
            { type: "tel", required: true, maxLength: 32, autoComplete: "tel" },
            copy["phone.hint"],
          )}
          {textInput("companyName", { type: "text", maxLength: 120, autoComplete: "organization" })}
          <div>
            <label htmlFor={fieldId("projectNotes")} className="font-semibold">
              {labels.projectNotes}
            </label>
            <Hint id="projectNotes">{copy["notes.hint"]}</Hint>
            <textarea
              id={fieldId("projectNotes")}
              name="projectNotes"
              rows={6}
              required
              minLength={10}
              maxLength={5000}
              defaultValue=""
              aria-invalid={errors.projectNotes ? true : undefined}
              aria-describedby={describedBy("projectNotes", true, errors)}
              className={control}
            />
            <FieldError id="projectNotes" errors={errors} />
          </div>
          {nav(4)}
        </>,
      )}

      {stepSection(
        LAST,
        <>
          <p className="text-lg text-muted">{copy["review.intro"]}</p>
          {review && (
            <dl className="flex flex-col gap-4">
              {reviewGroup(copy["review.services"], 0, review.services.join(", "))}
              {reviewGroup(
                copy["review.types"],
                1,
                <ul className="space-y-1">
                  {review.types.map(({ service, labels: picked }) => (
                    <li key={service}>
                      <span className="font-semibold">{service}:</span> {picked.join(", ")}
                    </li>
                  ))}
                </ul>,
              )}
              {reviewGroup(copy["review.budget"], 2, review.budgetRange)}
              {reviewGroup(copy["review.timeline"], 3, review.timeline)}
              {reviewGroup(
                copy["review.details"],
                4,
                <ul className="space-y-1">
                  {review.details.map(({ label, value }) => (
                    <li key={label} className="whitespace-pre-line break-words">
                      <span className="font-semibold">{label}:</span> {value}
                    </li>
                  ))}
                </ul>,
              )}
            </dl>
          )}

          <div>
            <label className="flex items-start gap-3 text-lg">
              <input
                id={fieldId("consent")}
                type="checkbox"
                name="consent"
                // Not native `required`, for the reason given at radioGroup.
                aria-required="true"
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={describedBy("consent", false, errors)}
                className={`mt-1 ${box}`}
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
            <FieldError id="consent" errors={errors} />
          </div>

          {/* D10: mounted when this step first shows, so a challenge is visible and the token fresh. */}
          {review && (
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
          )}

          <div id="inquiry-feedback" tabIndex={-1} className="empty:hidden focus:outline-none">
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

          <div className="flex flex-wrap gap-4">
            <button type="button" onClick={back} className={secondaryButton}>
              {copy.back}
            </button>
            <button
              type="submit"
              disabled={pending}
              className={`${buttonClassName} disabled:cursor-wait`}
            >
              {pending ? copy.submitting : copy.submit}
            </button>
          </div>
        </>,
      )}

      {/* Phase 18 spec, D7: off-screen and hidden from assistive tech; any value means a bot. */}
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
    </form>
  );
}
