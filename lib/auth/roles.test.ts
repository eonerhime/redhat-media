import { describe, expect, it } from "vitest";
import { hasMinRole, isStaffRole, STAFF_ROLES, staffPanelLabel } from "./roles";

describe("staff roles", () => {
  it("knows only the three roles", () => {
    expect(["sales", "editor", "admin"].every(isStaffRole)).toBe(true);
    expect(isStaffRole("owner")).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
  });

  it("orders the roles sales < editor < admin (Phase 25 spec, D1)", () => {
    const pairs = STAFF_ROLES.flatMap((role) =>
      STAFF_ROLES.map((min) => `${role}>=${min}:${hasMinRole(role, min)}`),
    );
    expect(pairs).toEqual([
      "sales>=sales:true",
      "sales>=editor:false",
      "sales>=admin:false",
      "editor>=sales:true",
      "editor>=editor:true",
      "editor>=admin:false",
      "admin>=sales:true",
      "admin>=editor:true",
      "admin>=admin:true",
    ]);
  });

  it("names the panel after the role (D13)", () => {
    expect(staffPanelLabel("admin")).toBe("Admin panel");
    expect(staffPanelLabel("editor")).toBe("Editor panel");
    expect(staffPanelLabel("sales")).toBe("Sales panel");
  });
});
