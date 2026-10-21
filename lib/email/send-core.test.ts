import { describe, expect, it, vi } from "vitest";
import { createEmailSender, type OutgoingEmail, type ResendClient } from "./send-core";

const email: OutgoingEmail = {
  to: ["team@example.com"],
  subject: "New inquiry",
  html: "<p>Hi</p>",
  text: "Hi",
  idempotencyKey: "inquiry-team/abc",
};

const client = (send: ResendClient["emails"]["send"]): ResendClient => ({ emails: { send } });

describe("createEmailSender (Phase 20 spec, D8)", () => {
  it("sends from the configured sender with the idempotency key", async () => {
    const send = vi.fn().mockResolvedValue({ data: { id: "em_1" }, error: null });
    const result = await createEmailSender({ client: client(send), from: "RHM <a@example.com>" })({
      ...email,
      replyTo: "hello@example.com",
    });
    expect(result).toEqual({ status: "sent", id: "em_1" });
    expect(send).toHaveBeenCalledWith(
      {
        from: "RHM <a@example.com>",
        to: ["team@example.com"],
        subject: "New inquiry",
        html: "<p>Hi</p>",
        text: "Hi",
        replyTo: "hello@example.com",
      },
      { idempotencyKey: "inquiry-team/abc" },
    );
  });

  it("replaces every recipient with the redirect", async () => {
    const send = vi.fn().mockResolvedValue({ data: { id: "em_2" }, error: null });
    await createEmailSender({
      client: client(send),
      from: "RHM <a@example.com>",
      redirectTo: "delivered@resend.dev",
    })({ ...email, to: ["a@example.com", "b@example.com"] });
    expect(send.mock.calls[0]![0].to).toEqual(["delivered@resend.dev"]);
  });

  it("reports an API error by its name", async () => {
    const send = vi.fn().mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "secret detail", statusCode: 403 },
    });
    const result = await createEmailSender({ client: client(send), from: "RHM <a@example.com>" })(
      email,
    );
    expect(result).toEqual({ status: "failed", error: "validation_error" });
  });

  it("never throws: a thrown error is a failure named by its class", async () => {
    const send = vi.fn().mockRejectedValue(new TypeError("fetch failed: secret host"));
    const result = await createEmailSender({ client: client(send), from: "RHM <a@example.com>" })(
      email,
    );
    expect(result).toEqual({ status: "failed", error: "TypeError" });
  });
});
