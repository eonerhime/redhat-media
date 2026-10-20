import { describe, expect, it } from "vitest";
import { clientIp, UNKNOWN_IP } from "./client-ip";

const headers = (init: Record<string, string>) => new Headers(init);

describe("clientIp (Phase 18 spec, D6)", () => {
  it("prefers x-real-ip", () => {
    expect(
      clientIp(headers({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1" })),
    ).toBe("203.0.113.7");
  });

  it("falls back to the first x-forwarded-for entry", () => {
    expect(clientIp(headers({ "x-forwarded-for": " 198.51.100.1 , 10.0.0.1" }))).toBe(
      "198.51.100.1",
    );
  });

  it("accepts IPv6", () => {
    expect(clientIp(headers({ "x-real-ip": "2001:db8::1" }))).toBe("2001:db8::1");
  });

  it("skips a value that is not an IP", () => {
    expect(clientIp(headers({ "x-real-ip": "nope", "x-forwarded-for": "198.51.100.1" }))).toBe(
      "198.51.100.1",
    );
    expect(clientIp(headers({ "x-forwarded-for": "<script>" }))).toBe(UNKNOWN_IP);
  });

  it("returns unknown with neither header", () => {
    expect(clientIp(headers({}))).toBe("unknown");
  });
});
