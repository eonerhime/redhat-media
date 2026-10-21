import { describe, expect, it, vi } from "vitest";
import type { RenderedEmail } from "@/lib/email/render";
import type { EmailSender, SendResult } from "@/lib/email/send-core";
import { notifyInquiryCore, type NotifyDeps } from "./notify-core";
import type { SavedInquiry } from "./submit-core";

const NOW = new Date("2026-10-20T13:06:00Z");

const inquiry: SavedInquiry = {
  id: "cm123",
  acknowledge: true,
  data: {
    clientName: "Ada Obi",
    companyName: null,
    email: "ada@example.com",
    phone: "+2348031234567",
    services: ["PHOTOGRAPHY"],
    projectTypes: ["PHOTOGRAPHY.EVENT"],
    budgetRange: "NOT_SURE",
    timeline: "ASAP",
    projectNotes: "Notes",
    consentAt: new Date("2026-10-20T13:05:00Z"),
  },
};

const rendered = (subject: string): RenderedEmail => ({ subject, html: "<p/>", text: "" });

function deps(results: Partial<Record<"team" | "ack", SendResult>> = {}) {
  const send = vi.fn<EmailSender>(async (email) =>
    email.idempotencyKey.startsWith("inquiry-team")
      ? (results.team ?? { status: "sent", id: "em_team" })
      : (results.ack ?? { status: "sent", id: "em_ack" }),
  );
  return {
    send,
    renderTeam: vi.fn(async () => rendered("Team")),
    renderAck: vi.fn(async () => rendered("Ack")),
    markSent: vi.fn(async () => {}),
    now: () => NOW,
    notificationTo: ["team@example.com"],
    ackReplyTo: "hello@example.com",
    siteUrl: "https://redhat-media.vercel.app",
    log: vi.fn(),
  } satisfies NotifyDeps;
}

describe("notifyInquiryCore (Phase 20 spec, D3)", () => {
  it("sends both emails and marks each sent", async () => {
    const d = deps();
    expect(await notifyInquiryCore(inquiry, d)).toEqual({ team: "sent", ack: "sent" });
    expect(d.send).toHaveBeenNthCalledWith(1, {
      ...rendered("Team"),
      to: ["team@example.com"],
      idempotencyKey: "inquiry-team/cm123",
    });
    expect(d.send).toHaveBeenNthCalledWith(2, {
      ...rendered("Ack"),
      to: ["ada@example.com"],
      replyTo: "hello@example.com",
      idempotencyKey: "inquiry-ack/cm123",
    });
    expect(d.markSent.mock.calls).toEqual([
      ["cm123", "emailSentAt", NOW],
      ["cm123", "ackSentAt", NOW],
    ]);
    expect(d.log).not.toHaveBeenCalled();
  });

  it("renders with the received time and the site URL", async () => {
    const d = deps();
    await notifyInquiryCore(inquiry, d);
    expect(d.renderTeam).toHaveBeenCalledWith({
      id: "cm123",
      data: inquiry.data,
      receivedAt: inquiry.data.consentAt,
      siteUrl: "https://redhat-media.vercel.app",
    });
  });

  it("still sends the acknowledgment when the team notification fails, and logs it", async () => {
    const d = deps({ team: { status: "failed", error: "validation_error" } });
    expect(await notifyInquiryCore(inquiry, d)).toEqual({ team: "failed", ack: "sent" });
    expect(d.markSent.mock.calls).toEqual([["cm123", "ackSentAt", NOW]]);
    expect(d.log).toHaveBeenCalledWith("[email] team notification failed", {
      id: "cm123",
      error: "validation_error",
    });
  });

  it("still marks the team notification when the acknowledgment fails", async () => {
    const d = deps({ ack: { status: "failed", error: "TypeError" } });
    expect(await notifyInquiryCore(inquiry, d)).toEqual({ team: "sent", ack: "failed" });
    expect(d.markSent.mock.calls).toEqual([["cm123", "emailSentAt", NOW]]);
    expect(d.log).toHaveBeenCalledWith("[email] acknowledgment failed", {
      id: "cm123",
      error: "TypeError",
    });
  });

  it("sends no acknowledgment when it is off or over the limit", async () => {
    const d = deps();
    expect(await notifyInquiryCore({ ...inquiry, acknowledge: false }, d)).toEqual({
      team: "sent",
      ack: "off",
    });
    expect(d.send).toHaveBeenCalledOnce();
    expect(d.renderAck).not.toHaveBeenCalled();
  });

  it("marks nothing when Resend is not configured", async () => {
    const d = deps({ team: { status: "skipped" }, ack: { status: "skipped" } });
    expect(await notifyInquiryCore(inquiry, d)).toEqual({ team: "skipped", ack: "skipped" });
    expect(d.markSent).not.toHaveBeenCalled();
    expect(d.log).toHaveBeenCalledWith(
      "[email] skipped team notification: Resend is not configured",
      { id: "cm123" },
    );
  });

  it("treats a render error as a failed send", async () => {
    const d = deps();
    d.renderTeam.mockRejectedValueOnce(new RangeError("bad label"));
    expect(await notifyInquiryCore(inquiry, d)).toEqual({ team: "failed", ack: "sent" });
    expect(d.log).toHaveBeenCalledWith("[email] team notification failed", {
      id: "cm123",
      error: "RangeError",
    });
  });

  it("logs a send it could not record, without failing", async () => {
    const d = deps();
    d.markSent.mockRejectedValueOnce(new Error("db down"));
    expect(await notifyInquiryCore(inquiry, d)).toEqual({ team: "sent", ack: "sent" });
    expect(d.log).toHaveBeenCalledWith("[email] team notification sent but not recorded", {
      id: "cm123",
      error: "Error",
    });
  });

  it("never logs personal data", async () => {
    const d = deps({
      team: { status: "failed", error: "validation_error" },
      ack: { status: "failed", error: "TypeError" },
    });
    await notifyInquiryCore(inquiry, d);
    const logged = JSON.stringify(d.log.mock.calls);
    for (const value of ["Ada Obi", "ada@example.com", "+2348031234567", "Notes"]) {
      expect(logged).not.toContain(value);
    }
  });
});
