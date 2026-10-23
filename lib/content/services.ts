// The only way public code reads services (tech-stack.md → Architectural rules 3; Phase 2 spec, D7).
// Async for the same reason as block(): Phase 31 reads ServiceSetting overrides behind these.

import {
  pillars,
  services,
  type Pillar,
  type Service,
  type ServiceCategory,
} from "../../content/services";

// Per-category muted flag. Phase 31 fills it from ServiceSetting rows.
export type MutedOverrides = Partial<Record<ServiceCategory, boolean>>;

export type PillarGroup = { pillar: Pillar; services: readonly Service[] };

// Drops muted services and keeps config order. An override wins over the config default either way.
export function resolveVisibility(
  list: readonly Service[],
  overrides: MutedOverrides = {},
): readonly Service[] {
  return list.filter((service) => !(overrides[service.category] ?? service.muted));
}

// Groups visible services by pillar, in pillar order, leaving out pillars with none visible.
export function groupByPillar(visible: readonly Service[]): readonly PillarGroup[] {
  return pillars
    .map((pillar) => ({ pillar, services: visible.filter((s) => s.pillar === pillar.id) }))
    .filter((group) => group.services.length > 0);
}

export async function visibleServices(): Promise<readonly Service[]> {
  return resolveVisibility(services);
}

export async function visiblePillars(): Promise<readonly PillarGroup[]> {
  return groupByPillar(await visibleServices());
}

export function pillarOf(service: Service): Pillar {
  const pillar = pillars.find((p) => p.id === service.pillar);
  if (!pillar) throw new Error(`Unknown pillar: ${service.pillar}`);
  return pillar;
}

// Every service, muted included, by category: portfolio items keep their category label while
// their service is muted (Architectural rules 3; Phase 10 spec, D4). Labels only, never visibility.
export function serviceByCategory(category: ServiceCategory): Service {
  const service = services.find((s) => s.category === category);
  if (!service) throw new Error(`Unknown service category: ${category}`);
  return service;
}

// Static params only: every slug, muted included, so unmuting needs no redeploy
// (Architectural rules 3; Phase 5 spec, D1). Slugs only, never copy.
export function allServiceSlugs(): readonly string[] {
  return services.map((s) => s.slug);
}

// A "Start a project" link that pre-fills the inquiry stepper with a visible service, or the plain
// /contact for a muted service or none (Phase 21 spec, D1, D8).
export function contactPath(service: Service | undefined, visible: readonly Service[]): string {
  return service && visible.some((s) => s.category === service.category)
    ? `/contact?service=${service.slug}`
    : "/contact";
}

export async function contactHref(service?: Service): Promise<string> {
  return contactPath(service, await visibleServices());
}

// The service page's lookup. `undefined` for a muted or unknown slug, which the page turns into a 404.
export async function visibleServiceBySlug(slug: string): Promise<Service | undefined> {
  return (await visibleServices()).find((s) => s.slug === slug);
}
