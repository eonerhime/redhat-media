import { describe, expect, it } from "vitest";
import { totpCode, totpSecretFromUri, wrongTotpCode } from "./test-totp";

// RFC 6238 Appendix B, SHA-1 seed "12345678901234567890", last 6 of the 8 digits.
const SEED = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("test TOTP helper", () => {
  it.each([
    [59, "287082"],
    [1_111_111_109, "081804"],
    [1_234_567_890, "005924"],
    [2_000_000_000, "279037"],
  ])("matches the RFC 6238 vector at T=%i", (seconds, code) => {
    expect(totpCode(SEED, seconds * 1000)).toBe(code);
  });

  it("reads the secret from an otpauth URI", () => {
    expect(totpSecretFromUri(`otpauth://totp/RedHat%20Media:a@b.c?secret=${SEED}&issuer=x`)).toBe(
      SEED,
    );
  });

  it("finds a code that is wrong in the current and neighbouring windows", () => {
    const now = 59_000;
    const wrong = wrongTotpCode(SEED, now);
    for (const step of [-1, 0, 1]) expect(totpCode(SEED, now + step * 30_000)).not.toBe(wrong);
  });
});
