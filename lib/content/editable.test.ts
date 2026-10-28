import { describe, expect, it } from "vitest";
import { defaults } from "../../content/defaults";
import { BLOCK_KINDS, editableBlocks, editableKind } from "./editable";
import { BLOCK_KEY_PATTERN } from "./keys";

// The editable keys and their kinds (Phase 27 spec, D1, D4).

const entries = [...editableBlocks.entries()];

describe("editableBlocks", () => {
  it.each(entries)("%s is a default that fits its kind (%s)", (key, kind) => {
    expect(Object.hasOwn(defaults, key)).toBe(true);
    expect(key).toMatch(BLOCK_KEY_PATTERN);
    const value = defaults[key as keyof typeof defaults];
    expect(value.length).toBeLessThanOrEqual(BLOCK_KINDS[kind].max);
    if (!BLOCK_KINDS[kind].multiline) expect(value).not.toContain("\n");
  });

  it("leaves out metadata, the inquiry form, templates and hidden or transient text (D1)", () => {
    const left = Object.keys(defaults).filter((key) => !editableBlocks.has(key));
    for (const key of [...editableBlocks.keys()]) {
      expect(key).not.toMatch(/\.meta\.|^contact\.form\.|lightbox|loading|modal\./);
      expect(defaults[key as keyof typeof defaults]).not.toMatch(/\{[a-z]+\}/i);
    }
    expect(left).toEqual(
      expect.arrayContaining([
        "home.meta.description",
        "contact.form.heading",
        "contact.email.subject",
        "contact.email.copied",
        "contact.channels.heading",
        "portfolio.filter.label",
        "portfolio.detail.view",
      ]),
    );
  });

  it("lists every service and pillar's copy, and every privacy section", () => {
    expect(editableKind("services.webApp.name")).toBe("heading");
    expect(editableKind("services.webApp.deliverable3")).toBe("line");
    expect(editableKind("services.pillars.build.step2")).toBe("label");
    expect(editableKind("about.pillars.growth.role")).toBe("line");
    expect(editableKind("privacy.rights.body")).toBe("body");
  });

  it("knows nothing about unlisted or inherited keys", () => {
    expect(editableKind("home.meta.description")).toBeUndefined();
    expect(editableKind("toString")).toBeUndefined();
    expect(editableKind("")).toBeUndefined();
  });

  it("allows line breaks and bold in body blocks only, with the D4 caps", () => {
    expect(BLOCK_KINDS).toEqual({
      label: { max: 40, multiline: false },
      heading: { max: 120, multiline: false },
      line: { max: 300, multiline: false },
      body: { max: 5000, multiline: true },
    });
  });
});
