// The project-type rules (Phase 19 spec, D1, D3), Zod-free so the stepper's second step and
// inquiryInputSchema apply the same checks. Relative imports only, like https-url.ts.

import {
  categoryOf,
  isNotSure,
  isProjectTypeId,
  type ProjectTypeId,
} from "../../content/project-types.ts";
import type { ServiceCategory } from "../../content/services.ts";
import { MESSAGES, typesMissing, typesNotSureAlone } from "./inquiry-messages.ts";

export type ProjectTypeError = { category?: ServiceCategory; message: string };

/**
 * What is wrong with `types` for the chosen `services`: an unknown or repeated id, or one of a
 * service not chosen (no category), then per chosen service, in its order, none chosen or
 * "Not sure yet" with others. Empty when the types are valid.
 */
export function projectTypeErrors(
  services: readonly ServiceCategory[],
  types: readonly string[],
  serviceName: (category: ServiceCategory) => string,
): ProjectTypeError[] {
  const chosen = new Set(services);
  const known = types.filter(isProjectTypeId);
  if (
    known.length !== types.length ||
    new Set(types).size !== types.length ||
    !known.every((id) => chosen.has(categoryOf(id)))
  ) {
    return [{ message: MESSAGES.typesUnknown }];
  }

  const errors: ProjectTypeError[] = [];
  for (const category of services) {
    const own = known.filter((id: ProjectTypeId) => categoryOf(id) === category);
    if (own.length === 0) errors.push({ category, message: typesMissing(serviceName(category)) });
    else if (own.length > 1 && own.some(isNotSure))
      errors.push({ category, message: typesNotSureAlone(serviceName(category)) });
  }
  return errors;
}
