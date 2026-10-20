// Phone normalisation (Phase 17 spec, D6). Zod-free, so the Phase 19 stepper's step checks use
// the same rule as the server (Phase 19 spec, D9). Relative imports only, like https-url.ts.

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
