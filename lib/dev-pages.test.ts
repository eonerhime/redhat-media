import { describe, expect, it } from "vitest";
import { isDevPagesEnabled } from "./dev-pages";

describe("isDevPagesEnabled (Phase 8 spec, D11)", () => {
  it("is false on the production deployment", () => {
    expect(isDevPagesEnabled({ vercelEnv: "production" })).toBe(false);
  });

  it.each(["preview", "development", undefined] as const)("is true for %s", (vercelEnv) => {
    expect(isDevPagesEnabled({ vercelEnv })).toBe(true);
  });
});
