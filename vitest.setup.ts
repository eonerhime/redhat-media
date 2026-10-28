import { vi } from "vitest";

// Unit tests run outside Next, where "use cache" and cacheTag() don't work, so the cached content
// read is replaced by "no staff edits" and block() returns the defaults. read-core.test.ts and
// read-core.db.test.ts test the real lookup (Phase 27 spec, D6).
vi.mock("@/lib/content/read", () => ({
  CONTENT_TAG: "content",
  readContentBlocks: async () => ({ ok: true, overrides: {} }),
}));
