import { describe, expect, it } from "vitest";
import type { InquiryData } from "@/lib/inquiry/submit-core";
import {
  ACK_SUBJECT,
  formatLagosTime,
  renderClientAck,
  renderTeamNotification,
  teamSubject,
} from "./render";

const data: InquiryData = {
  clientName: "Ada Obi",
  companyName: "Obi Foods",
  email: "ada@example.com",
  phone: "+2348031234567",
  services: ["PHOTOGRAPHY", "VIDEOGRAPHY"],
  projectTypes: ["PHOTOGRAPHY.EVENT", "PHOTOGRAPHY.PRODUCT", "VIDEOGRAPHY.EVENT"],
  budgetRange: "FROM_500K_TO_1_5M",
  timeline: "WITHIN_1_MONTH",
  projectNotes: "Launch event in Lekki.\nAbout 200 guests.",
  consentAt: new Date("2026-10-20T13:05:00Z"),
};

// 13:05 UTC is 14:05 in Lagos (WAT, UTC+1, no daylight saving).
const input = {
  id: "cm123",
  data,
  receivedAt: new Date("2026-10-20T13:05:00Z"),
  siteUrl: "https://redhat-media.vercel.app",
};

/** The HTML without React's text separators, as a mail client shows it. */
const visible = (html: string) => html.replaceAll("<!-- -->", "");

// Payloads a visitor could type into the free-text fields (Phase 20 spec, D14).
const hostile = {
  clientName: '<script>alert("x")</script>',
  companyName: '<img src=x onerror="alert(1)">',
  projectNotes:
    'javascript:alert(1)\r\nBcc: victim@example.com\n<a href="https://evil.example">x</a>',
};

describe("formatLagosTime (Phase 20 spec, D4)", () => {
  it("formats in Lagos time", () => {
    expect(formatLagosTime(input.receivedAt)).toBe("Tue 20 Oct 2026, 14:05 WAT");
  });

  it("puts the time, and nothing typed, in the team subject", () => {
    expect(teamSubject(input.receivedAt)).toBe("New inquiry · Tue 20 Oct 2026, 14:05 WAT");
  });
});

describe("renderTeamNotification (Phase 20 spec, D4, Appendix A)", () => {
  it("shows every field, with project types as Service: Type", async () => {
    const { html, text } = await renderTeamNotification(input);
    for (const value of [
      "Ada Obi",
      "Obi Foods",
      "ada@example.com",
      "+2348031234567",
      "Photography: Event coverage",
      "Photography: Product photography",
      "Videography: Event coverage",
      "₦500,000 – ₦1.5 million",
      "Within a month",
      "Launch event in Lekki.",
      "Reference cm123",
      "Tue 20 Oct 2026, 14:05 WAT",
      "redhat-media.vercel.app",
    ]) {
      expect(text).toContain(value);
      expect(visible(html)).toContain(value);
    }
  });

  it("links only the validated email and phone", async () => {
    const { html } = await renderTeamNotification(input);
    const hrefs = [...html.matchAll(/href="([^"]*)"/g)].map((match) => match[1]);
    expect(hrefs).toEqual(["mailto:ada@example.com", "tel:+2348031234567"]);
  });

  it("keeps the notes' line breaks and shows phone and email once in plain text", async () => {
    const { text } = await renderTeamNotification(input);
    expect(text).toContain("Launch event in Lekki.\nAbout 200 guests.");
    expect(text).toContain("Phone: +2348031234567\n");
    expect(text).not.toContain("tel:");
    expect(text).not.toContain("mailto:");
  });

  it("shows a dash when there is no company", async () => {
    const { text } = await renderTeamNotification({
      ...input,
      data: { ...data, companyName: null },
    });
    expect(text).toContain("Company: —");
  });

  it("escapes hostile input in the HTML and keeps it out of the subject", async () => {
    const rendered = await renderTeamNotification({ ...input, data: { ...data, ...hostile } });
    // Escaped, a payload is text: no tag opens and no attribute is set.
    expect(rendered.html).not.toMatch(/<script|<img|<a href="https:\/\/evil|href="javascript:/i);
    expect(rendered.html).toContain("&lt;script&gt;");
    expect(rendered.subject).toBe(teamSubject(input.receivedAt));
    for (const value of Object.values(hostile)) expect(rendered.subject).not.toContain(value);
  });

  it("keeps hostile input as inert text in the plain-text version", async () => {
    const { text } = await renderTeamNotification({ ...input, data: { ...data, ...hostile } });
    expect(text).toContain('<script>alert("x")</script>');
    expect(text).not.toMatch(/\[https:\/\/evil\.example\]/);
  });
});

describe("renderClientAck (Phase 20 spec, D5, Appendix B)", () => {
  it("shows the fixed choices, the reply time and the privacy link", async () => {
    const { subject, html, text } = await renderClientAck(input);
    expect(subject).toBe(ACK_SUBJECT);
    for (const value of [
      "We reply within one working day.",
      "Photography: Event coverage",
      "Videography: Event coverage",
      "Within a month",
      "0802 658 1200",
      "RC 1379619",
    ]) {
      expect(text).toContain(value);
    }
    expect(html).toContain('href="https://redhat-media.vercel.app/privacy"');
  });

  it("carries no free text: not the name, company, email, phone or notes", async () => {
    const { subject, html, text } = await renderClientAck({
      ...input,
      data: { ...data, ...hostile },
    });
    for (const value of [
      ...Object.values(hostile),
      "Ada Obi",
      "Obi Foods",
      "ada@example.com",
      "+2348031234567",
      "Lekki",
      "alert",
      "evil.example",
    ]) {
      expect(html).not.toContain(value);
      expect(text).not.toContain(value);
      expect(subject).not.toContain(value);
    }
  });
});
