import "server-only";

import { Resend } from "resend";
import { env } from "@/lib/env";
import { createEmailSender, type EmailSender } from "./send-core";

export type { EmailSender, OutgoingEmail, SendResult } from "./send-core";

let sender: EmailSender | undefined;

/**
 * Sends one email through Resend (Phase 20 spec, D8). Resolves `skipped` when Resend is not
 * configured (CI, local) and `failed` on any error; never throws.
 *
 * @example const result = await sendEmail({ to, subject, html, text, idempotencyKey });
 */
export const sendEmail: EmailSender = async (email) => {
  if (!env.email) return { status: "skipped" };
  sender ??= createEmailSender({
    client: new Resend(env.email.resendApiKey),
    from: env.email.from,
    redirectTo: env.email.redirectTo,
  });
  return sender(email);
};
