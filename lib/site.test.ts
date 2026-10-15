import { describe, expect, it } from "vitest";
import { contact, mailtoHref } from "./site";

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
