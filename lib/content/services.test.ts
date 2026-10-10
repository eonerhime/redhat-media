import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pillars, serviceCategories, services, type Service } from "../../content/services";
import { groupByPillar, pillarOf, resolveVisibility } from "./services";

const camelCase = (category: string) =>
  category.toLowerCase().replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

const categoriesOf = (list: readonly Service[]) => list.map((s) => s.category);

describe("content/services.ts", () => {
  it("has six services in three pillars, grouped as Architectural rules 3", () => {
    expect(services).toHaveLength(6);
    expect(pillars.map((p) => p.id)).toEqual(["production", "growth", "build"]);
    expect(groupByPillar(services).map((g) => [g.pillar.id, categoriesOf(g.services)])).toEqual([
      ["production", ["PHOTOGRAPHY", "VIDEOGRAPHY"]],
      ["growth", ["DIGITAL_MARKETING", "SOCIAL_MEDIA", "ONLINE_PRESENCE"]],
      ["build", ["WEB_APP"]],
    ]);
  });

  it("has unique categories, ids and slugs, covering every category", () => {
    for (const field of ["category", "id", "slug"] as const) {
      expect(new Set(services.map((s) => s[field])).size).toBe(services.length);
    }
    expect([...categoriesOf(services)].sort()).toEqual([...serviceCategories].sort());
  });

  it.each(services)("$category has a URL-safe slug, a camelCase id and matching keys", (s) => {
    expect(s.slug).toMatch(/^[a-z0-9-]+$/);
    expect(s.id).toBe(camelCase(s.category));
    expect(s.nameKey).toBe(`services.${s.id}.name`);
    expect(s.summaryKey).toBe(`services.${s.id}.summary`);
  });

  // Numbered from 1 with no gaps (Phase 5 spec, D2).
  it.each(services)("$category has numbered included and deliverable keys", (s) => {
    expect(s.includedKeys).toEqual(
      s.includedKeys.map((_, i) => `services.${s.id}.included${i + 1}`),
    );
    expect(s.deliverableKeys).toEqual(
      s.deliverableKeys.map((_, i) => `services.${s.id}.deliverable${i + 1}`),
    );
  });

  it.each(pillars)("pillar $id has matching name, summary and step keys", (p) => {
    expect(p.nameKey).toBe(`services.pillars.${p.id}.name`);
    expect(p.summaryKey).toBe(`services.pillars.${p.id}.summary`);
    expect(p.stepKeys).toEqual([1, 2, 3].map((n) => `services.pillars.${p.id}.step${n}`));
  });

  it.each(services)("$category resolves to its pillar", (s) => {
    expect(pillarOf(s).id).toBe(s.pillar);
  });

  it("keeps at least one service visible", () => {
    expect(resolveVisibility(services).length).toBeGreaterThan(0);
  });

  // Drift guard until Prisma generates the enum in Phase 7 (Phase 2 spec, D8).
  it("matches enum ServiceCategory in README §5", () => {
    const readme = readFileSync(new URL("../../README.md", import.meta.url), "utf8");
    const body = readme.match(/enum ServiceCategory\s*\{([^}]*)\}/)?.[1];
    expect(body).toBeDefined();
    expect(body!.trim().split(/\s+/).sort()).toEqual([...serviceCategories].sort());
  });
});

describe("muting", () => {
  it("leaves out a muted service and keeps config order", () => {
    const muted = services.map((s) => (s.category === "VIDEOGRAPHY" ? { ...s, muted: true } : s));
    expect(categoriesOf(resolveVisibility(muted))).toEqual([
      "PHOTOGRAPHY",
      "DIGITAL_MARKETING",
      "SOCIAL_MEDIA",
      "ONLINE_PRESENCE",
      "WEB_APP",
    ]);
  });

  it("leaves out a pillar once all its services are muted", () => {
    const visible = resolveVisibility(services, { PHOTOGRAPHY: true, VIDEOGRAPHY: true });
    expect(groupByPillar(visible).map((g) => g.pillar.id)).toEqual(["growth", "build"]);
  });

  it("keeps a pillar while any of its services is visible", () => {
    const visible = resolveVisibility(services, { DIGITAL_MARKETING: true, SOCIAL_MEDIA: true });
    const growth = groupByPillar(visible).find((g) => g.pillar.id === "growth");
    expect(growth && categoriesOf(growth.services)).toEqual(["ONLINE_PRESENCE"]);
  });

  it("lets overrides win over config defaults in both directions", () => {
    const configMuted = services.map((s) => (s.category === "WEB_APP" ? { ...s, muted: true } : s));
    expect(categoriesOf(resolveVisibility(configMuted, { WEB_APP: false }))).toContain("WEB_APP");
    expect(categoriesOf(resolveVisibility(services, { WEB_APP: true }))).not.toContain("WEB_APP");
  });
});

describe("visibleServices() and visiblePillars()", () => {
  afterEach(() => {
    vi.doUnmock("../../content/services");
    vi.resetModules();
  });

  it("return every service and pillar while nothing is muted", async () => {
    const { visibleServices, visiblePillars } = await import("./services");
    expect(await visibleServices()).toEqual(services);
    expect((await visiblePillars()).map((g) => g.pillar.id)).toEqual([
      "production",
      "growth",
      "build",
    ]);
  });

  it("leave out a muted service, and its pillar once all its services are muted", async () => {
    vi.resetModules();
    vi.doMock("../../content/services", async (importOriginal) => {
      const actual = await importOriginal<typeof import("../../content/services")>();
      const mute = new Set(["DIGITAL_MARKETING", "WEB_APP"]);
      return {
        ...actual,
        services: actual.services.map((s) => (mute.has(s.category) ? { ...s, muted: true } : s)),
      };
    });
    const { visibleServices, visiblePillars } = await import("./services");

    expect(categoriesOf(await visibleServices())).toEqual([
      "PHOTOGRAPHY",
      "VIDEOGRAPHY",
      "SOCIAL_MEDIA",
      "ONLINE_PRESENCE",
    ]);
    expect((await visiblePillars()).map((g) => g.pillar.id)).toEqual(["production", "growth"]);
  });
});

describe("allServiceSlugs() and visibleServiceBySlug()", () => {
  afterEach(() => {
    vi.doUnmock("../../content/services");
    vi.resetModules();
  });

  it("find every service by slug while nothing is muted, and nothing for an unknown slug", async () => {
    const { allServiceSlugs, visibleServiceBySlug } = await import("./services");
    expect(allServiceSlugs()).toEqual(services.map((s) => s.slug));
    for (const s of services) expect(await visibleServiceBySlug(s.slug)).toEqual(s);
    expect(await visibleServiceBySlug("branding")).toBeUndefined();
    expect(await visibleServiceBySlug("")).toBeUndefined();
  });

  it("keep a muted slug in the static params but hide its service", async () => {
    vi.resetModules();
    vi.doMock("../../content/services", async (importOriginal) => {
      const actual = await importOriginal<typeof import("../../content/services")>();
      return {
        ...actual,
        services: actual.services.map((s) =>
          s.category === "VIDEOGRAPHY" ? { ...s, muted: true } : s,
        ),
      };
    });
    const { allServiceSlugs, visibleServiceBySlug } = await import("./services");

    expect(allServiceSlugs()).toContain("videography");
    expect(allServiceSlugs()).toHaveLength(6);
    expect(await visibleServiceBySlug("videography")).toBeUndefined();
    expect((await visibleServiceBySlug("photography"))?.category).toBe("PHOTOGRAPHY");
  });
});
