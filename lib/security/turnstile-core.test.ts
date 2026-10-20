import { describe, expect, it, vi } from "vitest";
import type { FetchFn } from "@/lib/media/fetch-capped";
import {
  createTurnstileVerifier,
  SITEVERIFY_URL,
  TURNSTILE_TEST_KEY,
  type TurnstileOptions,
} from "./turnstile-core";

const TEST_SECRET = "1x0000000000000000000000000000000AA";
// Shaped like a real secret; not one.
const REAL_SECRET = "0x4AAAAAAAexampleSecretKey000000000";
const HOST = "redhat-media.vercel.app";

const reply = (body: unknown, init: ResponseInit = {}): FetchFn =>
  vi.fn(async () => new Response(JSON.stringify(body), init));

function verifier(fetchFn: FetchFn, options: Partial<TurnstileOptions> = {}) {
  return createTurnstileVerifier({
    fetchFn,
    secret: REAL_SECRET,
    hostname: HOST,
    idempotencyKey: () => "key-1",
    ...options,
  });
}

const good = { success: true, hostname: HOST, action: "inquiry", "error-codes": [] };

describe("createTurnstileVerifier (Phase 18 spec, D5)", () => {
  it("accepts a token Cloudflare accepts for this host and action", async () => {
    const fetchFn = reply(good);
    expect(await verifier(fetchFn)("token", "203.0.113.7", "inquiry")).toBe(true);
  });

  it("POSTs the secret, token, remote IP and an idempotency key, with a timeout", async () => {
    const fetchFn = reply(good);
    await verifier(fetchFn)("token", "203.0.113.7", "inquiry");
    const [url, init] = vi.mocked(fetchFn).mock.calls[0]!;
    expect(url).toBe(SITEVERIFY_URL);
    expect(init?.method).toBe("POST");
    expect(init?.redirect).toBe("error");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    const body = new URLSearchParams(init?.body as URLSearchParams);
    expect(Object.fromEntries(body)).toEqual({
      secret: REAL_SECRET,
      response: "token",
      remoteip: "203.0.113.7",
      idempotency_key: "key-1",
    });
  });

  it("leaves remoteip out when the IP is unknown", async () => {
    const fetchFn = reply(good);
    await verifier(fetchFn)("token", undefined, "inquiry");
    const body = vi.mocked(fetchFn).mock.calls[0]![1]?.body as URLSearchParams;
    expect(body.has("remoteip")).toBe(false);
  });

  it("uses a fresh UUID as the idempotency key by default", async () => {
    const fetchFn = reply(good);
    const verify = createTurnstileVerifier({ fetchFn, secret: REAL_SECRET, hostname: HOST });
    await verify("a", undefined, "inquiry");
    await verify("b", undefined, "inquiry");
    const keys = vi
      .mocked(fetchFn)
      .mock.calls.map(([, init]) => (init?.body as URLSearchParams).get("idempotency_key"));
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/);
    expect(keys[0]).not.toBe(keys[1]);
  });

  it("refuses a token Cloudflare refuses", async () => {
    const fetchFn = reply({ success: false, "error-codes": ["invalid-input-response"] });
    expect(await verifier(fetchFn)("token", undefined, "inquiry")).toBe(false);
  });

  it.each([
    ["another form's action", { ...good, action: "login" }],
    ["no action", { ...good, action: undefined }],
    ["another site's hostname", { ...good, hostname: "evil.example" }],
    ["no hostname", { ...good, hostname: undefined }],
  ])("refuses %s with a real secret", async (_, body) => {
    expect(await verifier(reply(body))("token", undefined, "inquiry")).toBe(false);
  });

  it("ignores action and hostname with a test secret", async () => {
    const fetchFn = reply({ success: true, hostname: "example.com", action: "" });
    const verify = verifier(fetchFn, { secret: TEST_SECRET });
    expect(await verify("token", undefined, "inquiry")).toBe(true);
  });

  it.each([
    ["a missing token", undefined],
    ["an empty token", ""],
    ["a token over 2,048 characters", "x".repeat(2049)],
  ])("refuses %s without calling Cloudflare", async (_, token) => {
    const fetchFn = reply(good);
    expect(await verifier(fetchFn)(token, undefined, "inquiry")).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("fails closed on a timeout", async () => {
    const fetchFn: FetchFn = vi.fn(async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    });
    expect(await verifier(fetchFn)("token", undefined, "inquiry")).toBe(false);
  });

  it("fails closed on a network error", async () => {
    const fetchFn: FetchFn = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    expect(await verifier(fetchFn)("token", undefined, "inquiry")).toBe(false);
  });

  it("fails closed on an HTTP error", async () => {
    expect(await verifier(reply(good, { status: 500 }))("token", undefined, "inquiry")).toBe(false);
  });

  it("fails closed on a body that is not JSON or not the expected shape", async () => {
    const text: FetchFn = vi.fn(async () => new Response("<html>"));
    expect(await verifier(text)("token", undefined, "inquiry")).toBe(false);
    expect(await verifier(reply({ success: "yes" }))("token", undefined, "inquiry")).toBe(false);
  });
});

describe("TURNSTILE_TEST_KEY", () => {
  it.each([
    "1x00000000000000000000AA",
    "2x00000000000000000000AB",
    "1x00000000000000000000BB",
    "3x00000000000000000000FF",
    "1x0000000000000000000000000000000AA",
    "2x0000000000000000000000000000000AA",
    "3x0000000000000000000000000000000AA",
  ])("matches Cloudflare's test key %s", (key) => {
    expect(TURNSTILE_TEST_KEY.test(key)).toBe(true);
  });

  it("does not match a real-shaped key", () => {
    expect(TURNSTILE_TEST_KEY.test("0x4AAAAAAAexampleSiteKey")).toBe(false);
    expect(TURNSTILE_TEST_KEY.test(REAL_SECRET)).toBe(false);
  });
});
