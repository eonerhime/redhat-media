import { describe, expect, it } from "vitest";
import { services } from "../../content/services";
import { contactPath, resolveVisibility } from "../content/services";
import { prefillCategory } from "./prefill";

const [photography, , marketing] = services;
const allVisible = resolveVisibility(services);
// Marketing muted through an override, as Phase 31 will do (D8).
const marketingMuted = resolveVisibility(services, { [marketing.category]: true });

describe("contactPath() (Phase 21 spec, D8)", () => {
  it("links a visible service to /contact?service=<slug>", () => {
    expect(contactPath(photography, allVisible)).toBe("/contact?service=photography");
  });

  it("links a muted service to the plain /contact", () => {
    expect(contactPath(marketing, marketingMuted)).toBe("/contact");
  });

  it("links no service to the plain /contact", () => {
    expect(contactPath(undefined, allVisible)).toBe("/contact");
  });
});

describe("prefillCategory() (Phase 21 spec, D1, D8)", () => {
  it("ticks the visible service whose slug matches", () => {
    expect(prefillCategory("?service=photography", allVisible)).toBe(photography.category);
    expect(prefillCategory(`?service=${marketing.slug}`, allVisible)).toBe(marketing.category);
  });

  it("ticks nothing for a muted service, which the form was not given", () => {
    expect(prefillCategory(`?service=${marketing.slug}`, marketingMuted)).toBeUndefined();
  });

  it.each([
    ["unknown", "?service=nope"],
    ["empty", "?service="],
    ["missing", ""],
    ["wrong case", "?service=Photography"],
    ["an enum name", "?service=PHOTOGRAPHY"],
    ["a /portfolio filter", "?service=web-apps"],
  ])("ticks nothing for %s", (_, search) => {
    expect(prefillCategory(search, allVisible)).toBeUndefined();
  });

  it("uses only the first of repeated values", () => {
    expect(prefillCategory("?service=photography&service=videography", allVisible)).toBe(
      photography.category,
    );
    expect(prefillCategory("?service=nope&service=photography", allVisible)).toBeUndefined();
  });
});
