// Reads project-type labels (Phase 19 spec, Appendix B). Two labels repeat across services
// ("Event coverage"), so anywhere a type is shown outside its service group (the Phase 20
// emails, the Phase 32 inbox) shows both parts, e.g. "Photography: Event coverage".

import { categoryOf, projectTypes, type ProjectTypeId } from "../../content/project-types";
import { services } from "../../content/services";
import { block } from "./block";

export async function projectTypeLabel(
  id: ProjectTypeId,
): Promise<{ service: string; type: string }> {
  const category = categoryOf(id);
  const type = projectTypes[category].find((entry) => entry.id === id);
  const service = services.find((entry) => entry.category === category);
  if (!type || !service) throw new Error(`Unknown project type: ${id}`);
  const [serviceName, typeLabel] = await Promise.all([
    block(service.nameKey),
    block(type.labelKey),
  ]);
  return { service: serviceName, type: typeLabel };
}
