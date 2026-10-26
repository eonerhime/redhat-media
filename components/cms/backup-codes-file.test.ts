import { describe, expect, it } from "vitest";
import { backupCodesFileName, backupCodesText } from "./backup-codes-file";

const codes = Array.from({ length: 10 }, (_, i) => `code-${i + 1}`);

// Phase 24 spec, D7 (amended 2026-10-26).
describe("backupCodesText", () => {
  const text = backupCodesText(codes, "rhm.example", new Date("2026-10-26T19:00:00Z"));

  it("names the site and the time, so a dev, preview or production file can be told apart", () => {
    expect(text).toContain("Site: rhm.example");
    expect(text).toContain("Created: 2026-10-26T19:00:00.000Z");
  });

  it("lists all ten codes, numbered, one per line", () => {
    const lines = text.split("\n");
    expect(lines).toContain(" 1. code-1");
    expect(lines).toContain("10. code-10");
    expect(codes.every((code) => text.includes(code))).toBe(true);
  });

  it("is saved as a .txt file", () => {
    expect(backupCodesFileName).toMatch(/\.txt$/);
  });
});
