import "server-only";

import { getDb } from "@/lib/db";
import { renderClientAck, renderTeamNotification } from "@/lib/email/render";
import { sendEmail } from "@/lib/email/send";
import { env } from "@/lib/env";
import { contact } from "@/lib/site";
import { notifyInquiryCore, type NotifyOutcome } from "./notify-core";
import type { SavedInquiry } from "./submit-core";

/**
 * Emails a saved inquiry to the team and, when allowed, the client (Phase 20 spec, D3). Never
 * throws: every failure is logged by inquiry id.
 *
 * @example after(() => notifyInquiry(saved));
 */
export function notifyInquiry(inquiry: SavedInquiry): Promise<NotifyOutcome> {
  return notifyInquiryCore(inquiry, {
    send: sendEmail,
    renderTeam: renderTeamNotification,
    renderAck: renderClientAck,
    markSent: async (id, column, at) => {
      // Guarded by IS NULL, so a repeat run never moves the first send's time.
      await getDb().inquiry.updateMany({ where: { id, [column]: null }, data: { [column]: at } });
    },
    now: () => new Date(),
    notificationTo: env.email?.notificationTo ?? [],
    ackReplyTo: contact.email,
    siteUrl: env.siteUrl,
    log: (message, detail) => console.error(message, detail),
  });
}
