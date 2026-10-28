import { afterAll, describe, expect, it } from "vitest";
import { testPrisma } from "@/lib/db/test-client";
import { fetchContentBlocks, resolveBlock } from "./read-core";

// Staff copy edits against a real Postgres (Phase 27 spec, D6, D10), as rhm_app, the runtime
// role: it reads, saves, updates and resets a row, which is everything Phase 27's action does.

const app = testPrisma("app");
const KEY = "home.hero.tagline";

afterAll(async () => {
  await app.contentBlock.deleteMany({ where: { key: KEY } });
  await app.$disconnect();
});

describe("ContentBlock as rhm_app", () => {
  it("shows the default with no row, the saved value with one, and the default after a reset", async () => {
    await app.contentBlock.deleteMany({ where: { key: KEY } });
    const before = await fetchContentBlocks(app);
    expect(Object.hasOwn(before, KEY)).toBe(false);
    const fallback = resolveBlock(KEY, before);

    await app.contentBlock.create({ data: { key: KEY, value: "Saved once." } });
    await app.contentBlock.update({ where: { key: KEY }, data: { value: "Saved twice." } });
    expect(resolveBlock(KEY, await fetchContentBlocks(app))).toBe("Saved twice.");

    await app.contentBlock.delete({ where: { key: KEY } });
    expect(resolveBlock(KEY, await fetchContentBlocks(app))).toBe(fallback);
  });
});
