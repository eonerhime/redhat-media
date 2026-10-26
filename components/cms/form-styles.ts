// The staff forms reuse the inquiry form's look (components/contact/inquiry-form.tsx).

export { buttonClassName } from "@/components/shared/button-link";

export const labelClassName = "font-semibold";

export const controlClassName =
  "mt-2 block w-full rounded-md border border-line bg-ink px-4 py-3 text-lg text-fg aria-invalid:border-brand";

export const secondaryButtonClassName =
  "inline-flex items-center rounded-md border border-line px-6 py-3 font-semibold text-fg hover:border-fg disabled:cursor-wait";

export const textLinkClassName =
  "font-semibold underline decoration-brand decoration-2 underline-offset-4";

/** An error under a form: announced, and marked with the brand bar like the inquiry form's. */
export const errorClassName = "border-l-4 border-brand pl-3 text-base font-semibold";
