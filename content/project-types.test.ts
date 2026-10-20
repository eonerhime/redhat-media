import { describe, expect, it } from "vitest";
import { projectTypeLabel } from "@/lib/content/project-types";
import { defaults } from "./defaults";
import {
  categoryOf,
  isNotSure,
  isProjectTypeId,
  projectTypeIds,
  projectTypes,
} from "./project-types";
import { serviceCategories, services } from "./services";

// Phase 19 spec, D1, D13, Appendix B.

const camelCase = (value: string) =>
  value.toLowerCase().replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

describe("content/project-types.ts", () => {
  it("has a list for every service and unique ids", () => {
    expect(Object.keys(projectTypes).sort()).toEqual([...serviceCategories].sort());
    expect(new Set(projectTypeIds).size).toBe(projectTypeIds.length);
  });

  it.each(services)("$category: ids are CATEGORY.TYPE, ending with NOT_SURE", (service) => {
    const list = projectTypes[service.category];
    expect(list.length).toBeGreaterThanOrEqual(4);
    for (const type of list) {
      expect(type.id).toMatch(new RegExp(`^${service.category}\\.[A-Z][A-Z_]*$`));
      expect(categoryOf(type.id)).toBe(service.category);
    }
    expect(list.at(-1)?.id).toBe(`${service.category}.NOT_SURE`);
    expect(list.filter((type) => isNotSure(type.id))).toHaveLength(1);
  });

  it.each(services)("$category: every label key matches its id and has a default", (service) => {
    for (const type of projectTypes[service.category]) {
      const typePart = camelCase(type.id.slice(service.category.length + 1));
      expect(type.labelKey).toBe(`contact.form.types.${service.id}.${typePart}`);
      expect(defaults[type.labelKey]).toBeTruthy();
    }
  });

  it("recognises known ids only", () => {
    expect(isProjectTypeId("WEB_APP.SHOP")).toBe(true);
    for (const id of [
      "WEB_APP",
      "WEB_APP.",
      "WEB_APP.PACKAGE",
      "web_app.shop",
      "BRANDING.NOT_SURE",
    ])
      expect(isProjectTypeId(id)).toBe(false);
  });

  it("labels a type with its service", async () => {
    await expect(projectTypeLabel("PHOTOGRAPHY.EVENT")).resolves.toEqual({
      service: defaults["services.photography.name"],
      type: "Event coverage",
    });
    await expect(projectTypeLabel("PHOTOGRAPHY.PACKAGE")).rejects.toThrow("Unknown project type");
  });
});
