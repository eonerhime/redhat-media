import { describe, expect, it } from "vitest";
import { STAFF_ROLES } from "@/lib/auth/roles";
import {
  canEdit,
  clearEditState,
  EDIT_MODE_KEY,
  readCachedRole,
  readEditToggle,
  rememberRole,
  ROLE_KEY,
  writeEditToggle,
} from "./edit-storage";

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

const throwingStore = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
};

// Phase 26 spec, D4–D7.
describe("canEdit", () => {
  it("is true for editors and admins only", () => {
    expect(STAFF_ROLES.map((role) => [role, canEdit(role)])).toEqual([
      ["sales", false],
      ["editor", true],
      ["admin", true],
    ]);
  });

  it("is false with no role (a visitor, or staff without 2FA)", () => {
    expect(canEdit(null)).toBe(false);
  });
});

describe("the cached role", () => {
  it("reads back a staff role and ignores anything else", () => {
    expect(readCachedRole(memoryStore({ [ROLE_KEY]: "editor" }))).toBe("editor");
    expect(readCachedRole(memoryStore({ [ROLE_KEY]: "owner" }))).toBeNull();
    expect(readCachedRole(memoryStore())).toBeNull();
  });

  it("is written for a role and removed for none", () => {
    const store = memoryStore();
    rememberRole("admin", store);
    expect(store.data.get(ROLE_KEY)).toBe("admin");
    rememberRole(null, store);
    expect(store.data.has(ROLE_KEY)).toBe(false);
  });
});

describe("the Editing toggle", () => {
  it("is Off unless stored as on", () => {
    expect(readEditToggle(memoryStore())).toBe(false);
    expect(readEditToggle(memoryStore({ [EDIT_MODE_KEY]: "0" }))).toBe(false);
    expect(readEditToggle(memoryStore({ [EDIT_MODE_KEY]: "1" }))).toBe(true);
  });

  it("round-trips", () => {
    const store = memoryStore();
    writeEditToggle(true, store);
    expect(readEditToggle(store)).toBe(true);
    writeEditToggle(false, store);
    expect(readEditToggle(store)).toBe(false);
  });

  it("is kept for an editor or admin answer", () => {
    for (const role of ["editor", "admin"] as const) {
      const store = memoryStore({ [EDIT_MODE_KEY]: "1" });
      rememberRole(role, store);
      expect(readEditToggle(store)).toBe(true);
    }
  });

  it("is dropped when the answer has no editor role (D7)", () => {
    for (const role of ["sales", null] as const) {
      const store = memoryStore({ [EDIT_MODE_KEY]: "1" });
      rememberRole(role, store);
      expect(store.data.has(EDIT_MODE_KEY)).toBe(false);
    }
  });

  it("is cleared with the role on sign-out", () => {
    const store = memoryStore({ [ROLE_KEY]: "admin", [EDIT_MODE_KEY]: "1" });
    clearEditState(store);
    expect(store.data.size).toBe(0);
  });
});

describe("blocked storage", () => {
  it("never throws, and reads as a visitor with editing off", () => {
    expect(readCachedRole(throwingStore)).toBeNull();
    expect(readEditToggle(throwingStore)).toBe(false);
    expect(() => writeEditToggle(true, throwingStore)).not.toThrow();
    expect(() => rememberRole("editor", throwingStore)).not.toThrow();
    expect(() => clearEditState(throwingStore)).not.toThrow();
  });

  it("falls back to no store outside a browser", () => {
    expect(readCachedRole()).toBeNull();
    expect(readEditToggle()).toBe(false);
    expect(() => clearEditState()).not.toThrow();
  });
});
