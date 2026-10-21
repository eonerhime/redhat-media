// Sending through Resend (Phase 20 spec, D8). The server entry point is ./send.ts; this module
// takes the client, sender and redirect as arguments so tests need no network or key.

export type OutgoingEmail = {
  to: readonly string[];
  /** Fixed text and server values only, never user input (spec C2). */
  subject: string;
  html: string;
  text: string;
  /** A fixed address, never user input (spec C2). */
  replyTo?: string;
  /** Resend keeps a key for 24 hours, so a repeat send of the same email is dropped (D3). */
  idempotencyKey: string;
};

/** `skipped`: Resend is not configured (CI, local), so nothing was attempted. */
export type SendResult =
  { status: "sent"; id: string } | { status: "failed"; error: string } | { status: "skipped" };

/** Sends one email. Never throws: every failure is a `failed` result. */
export type EmailSender = (email: OutgoingEmail) => Promise<SendResult>;

/** The slice of the Resend SDK used here (`resend.emails.send`). */
export type ResendClient = {
  emails: {
    send: (
      payload: {
        from: string;
        to: string[];
        subject: string;
        html: string;
        text: string;
        replyTo?: string;
      },
      options: { idempotencyKey: string },
    ) => Promise<{ data: { id: string } | null; error: { name: string } | null }>;
  };
};

/**
 * @example const send = createEmailSender({ client: new Resend(key), from: "RHM <a@b.c>" });
 */
export function createEmailSender(options: {
  client: ResendClient;
  from: string;
  /** Replaces every recipient (Vercel Preview: delivered@resend.dev). */
  redirectTo?: string;
}): EmailSender {
  const { client, from, redirectTo } = options;
  return async ({ to, subject, html, text, replyTo, idempotencyKey }) => {
    try {
      const { data, error } = await client.emails.send(
        { from, to: redirectTo ? [redirectTo] : [...to], subject, html, text, replyTo },
        { idempotencyKey },
      );
      if (error || !data) return { status: "failed", error: error?.name ?? "no_data" };
      return { status: "sent", id: data.id };
    } catch (error) {
      // A network failure or timeout. Only the class name: messages can carry request details.
      return { status: "failed", error: error instanceof Error ? error.name : "unknown" };
    }
  };
}
