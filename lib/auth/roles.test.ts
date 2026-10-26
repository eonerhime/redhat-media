import { describe, expect, it } from "vitest";
import { isStaffRole, staffPanelLabel } from "./roles";

describe("staff roles", () => {
  it("knows only the three roles", () => {
    expect(["sales", "editor", "admin"].every(isStaffRole)).toBe(true);
    expect(isStaffRole("owner")).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
  });

  it("names the panel after the role (D13)", () => {
    expect(staffPanelLabel("admin")).toBe("Admin panel");
    expect(staffPanelLabel("editor")).toBe("Editor panel");
    expect(staffPanelLabel("sales")).toBe("Sales panel");
  });
});
