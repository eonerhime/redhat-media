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
