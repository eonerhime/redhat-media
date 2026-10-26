// TOTP codes for tests and e2e only (RFC 6238: HMAC-SHA1, 6 digits, 30 s, the
// Better Auth defaults). Never imported by app code.

import { createHmac } from "node:crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string): Buffer {
  let bits = "";
  for (const char of input.replace(/=+$/, "").toUpperCase()) {
    const value = BASE32.indexOf(char);
    if (value < 0) throw new Error("Not base32");
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

/** The secret from an otpauth:// URI, as Better Auth's get-totp-uri returns it. */
export function totpSecretFromUri(uri: string): string {
  const secret = new URL(uri).searchParams.get("secret");
  if (!secret) throw new Error("No secret in the TOTP URI");
  return secret;
}

/** The 6-digit code for a base32 secret at `nowMs`. */
export function totpCode(base32Secret: string, nowMs = Date.now()): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(nowMs / 30_000)));
  const hmac = createHmac("sha1", base32Decode(base32Secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 1_000_000).padStart(6, "0");
}

/** A 6-digit code that is certainly wrong for `base32Secret` right now. */
export function wrongTotpCode(base32Secret: string, nowMs = Date.now()): string {
  const right = new Set([-1, 0, 1].map((step) => totpCode(base32Secret, nowMs + step * 30_000)));
  for (let n = 0; ; n++) {
    const code = String(n).padStart(6, "0");
    if (!right.has(code)) return code;
  }
}
