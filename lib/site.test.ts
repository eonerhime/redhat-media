import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { business, contact, mailtoHref, navItems, notFoundCopy } from "./site";

const digits = (value: string) => value.replace(/\D/g, "");

// Phase 13 spec, D5 and D8: the links dial and message the numbers the page shows.
describe("contact site data", () => {
  it("dials the displayed local number in international form", () => {
    expect(contact.phoneHref).toBe(`tel:+234${digits(contact.phoneDisplay).slice(1)}`);
  });

  it("shows the same number in international form", () => {
    expect(`tel:+${digits(contact.phoneInternational)}`).toBe(contact.phoneHref);
  });

  it("opens WhatsApp on the same number over https", () => {
    expect(contact.whatsappHref).toBe(`https://wa.me/${digits(contact.phoneInternational)}`);
  });
});

describe("mailtoHref()", () => {
  it("links to the team address", () => {
    expect(mailtoHref()).toBe(`mailto:${contact.email}`);
  });

  it("encodes the subject", () => {
    expect(mailtoHref("Project inquiry & quote?")).toBe(
      `mailto:${contact.email}?subject=Project%20inquiry%20%26%20quote%3F`,
    );
  });
});

// Phase 14 spec, D6: the structured data states the same facts as the page.
describe("business site data", () => {
  it("has the hours the page shows (Monday to Friday, 9am to 6pm)", () => {
    const { days, opens, closes } = business.openingHours;
    expect(contact.hours).toBe(
      `${days[0]} to ${days.at(-1)}, ${Number(opens.slice(0, 2))}am to ${Number(closes.slice(0, 2)) - 12}pm (WAT)`,
    );
    expect(days).toHaveLength(5);
  });

  it("has the city the page shows, with no street address", () => {
    expect(contact.location).toBe(`${business.address.locality}, Nigeria`);
    expect(business.address).not.toHaveProperty("street");
  });

  it("points at a logo file that exists", () => {
    expect(existsSync(join("public", business.logoOnLight))).toBe(true);
  });
});

// Phase 15 spec, D1 (owner answer G): every 404 leads back to the work and to an inquiry.
describe("notFoundCopy", () => {
  it("links home, to services and to the portfolio, with contact as the call to action", () => {
    expect(notFoundCopy.links.map((link) => link.href)).toEqual(["/", "/services", "/portfolio"]);
    expect(notFoundCopy.cta).toEqual({ href: "/contact", label: "Contact us" });
  });

  it("links only to pages in the nav, plus home", () => {
    const pages = new Set<string>(["/", ...navItems.map((item) => item.href)]);
    for (const { href } of [...notFoundCopy.links, notFoundCopy.cta]) expect(pages).toContain(href);
  });
});
