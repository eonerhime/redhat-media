import Link from "next/link";
import { describe, expect, it } from "vitest";
import { ButtonLink } from "./button-link";

// Phase 13 spec, D5. ButtonLink has no hooks, so it can be called as a plain function and its
// element inspected without rendering next/link.
describe("<ButtonLink>", () => {
  it("routes a path through next/link", () => {
    const element = ButtonLink({ href: "/contact", children: "Start a project" });
    expect(element.type).toBe(Link);
    expect(element.props).toMatchObject({ href: "/contact" });
  });

  it("renders a mailto: link as a plain <a> with the same classes", () => {
    const route = ButtonLink({ href: "/contact", children: "x" });
    const element = ButtonLink({ href: "mailto:team@example.com", children: "Email us" });
    expect(element.type).toBe("a");
    expect(element.props).toMatchObject({
      href: "mailto:team@example.com",
      className: (route.props as { className: string }).className,
    });
  });
});
