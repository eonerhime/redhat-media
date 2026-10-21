// Emails a saved inquiry (Phase 20 spec, D3): the team notification, then the client
// acknowledgment, each independent of the other. Runs after the response (`after()` in
// app/(public)/contact/actions.ts); tests pass fakes, so it needs no network or database.

import type { InquiryEmailInput, RenderedEmail } from "@/lib/email/render";
import type { EmailSender, SendResult } from "@/lib/email/send-core";
import type { SavedInquiry } from "./submit-core";

export type SentColumn = "emailSentAt" | "ackSentAt";

export type NotifyDeps = {
  send: EmailSender;
  renderTeam: (input: InquiryEmailInput) => Promise<RenderedEmail>;
  renderAck: (input: InquiryEmailInput) => Promise<RenderedEmail>;
  /** Sets `column` to `at` only while it is still NULL. */
  markSent: (id: string, column: SentColumn, at: Date) => Promise<void>;
  now: () => Date;
  notificationTo: readonly string[];
  /** The acknowledgment's Reply-To: the site email, fixed (D5). */
  ackReplyTo: string;
  siteUrl: string;
  /** Called with the inquiry id and an error name only: no personal data in logs (spec C3). */
  log: (message: string, detail: { id: string; error?: string }) => void;
};

export type NotifyOutcome = { team: SendResult["status"]; ack: SendResult["status"] | "off" };

type Email = { kind: "team notification" | "acknowledgment"; column: SentColumn; key: string };

async function deliver(
  email: Email,
  inquiry: SavedInquiry,
  render: () => Promise<RenderedEmail>,
  recipients: { to: readonly string[]; replyTo?: string },
  deps: NotifyDeps,
): Promise<SendResult["status"]> {
  const { id } = inquiry;
  let result: SendResult;
  try {
    result = await deps.send({
      ...(await render()),
      ...recipients,
      idempotencyKey: `${email.key}/${id}`,
    });
  } catch (error) {
    // A render error; send() itself never throws.
    result = { status: "failed", error: error instanceof Error ? error.name : "unknown" };
  }
  if (result.status === "skipped") {
    deps.log(`[email] skipped ${email.kind}: Resend is not configured`, { id });
  } else if (result.status === "failed") {
    deps.log(`[email] ${email.kind} failed`, { id, error: result.error });
  } else {
    try {
      await deps.markSent(id, email.column, deps.now());
    } catch (error) {
      // Sent but not recorded: the monitor may report it, so say so in the log.
      deps.log(`[email] ${email.kind} sent but not recorded`, {
        id,
        error: error instanceof Error ? error.name : "unknown",
      });
    }
  }
  return result.status;
}

/**
 * @example after(() => notifyInquiryCore(saved, deps));
 */
export async function notifyInquiryCore(
  inquiry: SavedInquiry,
  deps: NotifyDeps,
): Promise<NotifyOutcome> {
  const input: InquiryEmailInput = {
    id: inquiry.id,
    data: inquiry.data,
    receivedAt: inquiry.data.consentAt,
    siteUrl: deps.siteUrl,
  };
  const team = await deliver(
    { kind: "team notification", column: "emailSentAt", key: "inquiry-team" },
    inquiry,
    () => deps.renderTeam(input),
    { to: deps.notificationTo },
    deps,
  );
  if (!inquiry.acknowledge) return { team, ack: "off" };
  const ack = await deliver(
    { kind: "acknowledgment", column: "ackSentAt", key: "inquiry-ack" },
    inquiry,
    () => deps.renderAck(input),
    { to: [inquiry.data.email], replyTo: deps.ackReplyTo },
    deps,
  );
  return { team, ack };
}
