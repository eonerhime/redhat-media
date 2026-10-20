import { describe, expect, it } from "vitest";
import {
  BudgetRange,
  InquiryStatus,
  InquiryTimeline,
  ServiceCategory,
} from "@/lib/generated/prisma/enums";
import { serviceCategories } from "@/content/services";
import {
  budgetRanges,
  inquiryInputSchema,
  inquiryStatuses,
  inquiryTimelines,
  toE164,
  toInquiryData,
} from "./inquiry";

// Roadmap Phase 17 "Done when": unit tests accept valid inquiries and reject
// each invalid field with a specific message (Phase 17 spec, D5–D9, Appendix A).
// Phase 19 adds the project-type rules and makes budget and timeline required (D3).

const minimal = {
  clientName: "Ada Obi",
  email: "ada@example.com",
  phone: "0803 123 4567",
  services: ["PHOTOGRAPHY"],
  projectTypes: ["PHOTOGRAPHY.NOT_SURE"],
  budgetRange: "NOT_SURE",
  timeline: "FLEXIBLE",
  projectNotes: "Product shoot for our new skincare line.",
  consent: true,
};

const full = {
  ...minimal,
  companyName: "Glow Labs Ltd",
  services: ["WEB_APP", "VIDEOGRAPHY", "SOCIAL_MEDIA"],
  projectTypes: ["WEB_APP.WEBSITE", "WEB_APP.SHOP", "VIDEOGRAPHY.PROMO", "SOCIAL_MEDIA.NOT_SURE"],
  budgetRange: "FROM_1_5M_TO_5M",
  timeline: "ONE_TO_THREE_MONTHS",
  projectNotes: "A launch video and a website.\nWe go live in March.",
};

const issuesFor = (input: unknown) => {
  const result = inquiryInputSchema.safeParse(input);
  expect(result.success).toBe(false);
  return result.success ? [] : result.error.issues;
};

describe("inquiryInputSchema: valid inquiries", () => {
  it("accepts a minimal inquiry and normalises it", () => {
    expect(inquiryInputSchema.parse(minimal)).toEqual({
      clientName: "Ada Obi",
      email: "ada@example.com",
      phone: "+2348031234567",
      services: ["PHOTOGRAPHY"],
      projectTypes: ["PHOTOGRAPHY.NOT_SURE"],
      budgetRange: "NOT_SURE",
      timeline: "FLEXIBLE",
      projectNotes: "Product shoot for our new skincare line.",
      consent: true,
    });
  });

  it("accepts a full inquiry with several services", () => {
    expect(inquiryInputSchema.parse(full)).toEqual({ ...full, phone: "+2348031234567" });
  });

  it("trims every text field", () => {
    const parsed = inquiryInputSchema.parse({
      ...full,
      clientName: "  Ada Obi ",
      companyName: " Glow Labs Ltd ",
      email: " ada@example.com ",
      phone: " 0803 123 4567 ",
      projectNotes: "\n  A launch video and a website.\nWe go live in March.  \n",
    });
    expect(parsed).toMatchObject({
      clientName: "Ada Obi",
      companyName: "Glow Labs Ltd",
      email: "ada@example.com",
      phone: "+2348031234567",
      projectNotes: full.projectNotes,
    });
  });

  it("treats a blank company name as absent", () => {
    expect(
      inquiryInputSchema.parse({ ...minimal, companyName: "   " }).companyName,
    ).toBeUndefined();
  });

  it("drops keys the client must not set", () => {
    const parsed = inquiryInputSchema.parse({
      ...minimal,
      id: "attacker-id",
      status: "CLOSED",
      consentAt: "2000-01-01T00:00:00.000Z",
      emailSentAt: "2000-01-01T00:00:00.000Z",
      ackSentAt: "2000-01-01T00:00:00.000Z",
    });
    for (const key of ["id", "status", "consentAt", "emailSentAt", "ackSentAt"])
      expect(parsed).not.toHaveProperty(key);
  });

  it("accepts every service, budget range and timeline", () => {
    const everyService = {
      ...minimal,
      services: [...serviceCategories],
      projectTypes: serviceCategories.map((category) => `${category}.NOT_SURE`),
    };
    expect(inquiryInputSchema.parse(everyService).services).toEqual([...serviceCategories]);
    for (const budgetRange of budgetRanges)
      expect(inquiryInputSchema.parse({ ...minimal, budgetRange }).budgetRange).toBe(budgetRange);
    for (const timeline of inquiryTimelines)
      expect(inquiryInputSchema.parse({ ...minimal, timeline }).timeline).toBe(timeline);
  });
});

describe("inquiryInputSchema: each invalid field has its own message (Appendix A)", () => {
  it.each([
    ["clientName", "missing", undefined, "Enter your name."],
    ["clientName", "empty", "   ", "Enter your name."],
    ["clientName", "one character", "A", "Enter your name."],
    ["clientName", "too long", "a".repeat(101), "Your name must be at most 100 characters."],
    ["clientName", "a line break", "Ada\nObi", "Your name must be on one line."],
    ["clientName", "a control character", "Ada\u0007Obi", "Your name must be on one line."],
    [
      "clientName",
      "a Unicode line separator",
      `Ada${String.fromCharCode(0x2028)}Obi`,
      "Your name must be on one line.",
    ],
    ["companyName", "too long", "c".repeat(121), "Company name must be at most 120 characters."],
    ["companyName", "a line break", "Glow\r\nLabs", "Company name must be on one line."],
    ["email", "missing", undefined, "Enter a valid email address, like name@example.com."],
    ["email", "invalid", "ada@", "Enter a valid email address, like name@example.com."],
    [
      "email",
      "a header injection",
      "ada@example.com\nBcc: x@example.com",
      "Enter a valid email address, like name@example.com.",
    ],
    [
      "email",
      "too long",
      `${"a".repeat(64)}@${"b".repeat(186)}.com`,
      "Email addresses must be at most 254 characters.",
    ],
    ["phone", "missing", undefined, "Enter a phone number we can reach you on."],
    ["phone", "empty", "  ", "Enter a phone number we can reach you on."],
    [
      "phone",
      "letters",
      "call me",
      "Enter a phone number like 0803 123 4567, or with a country code like +44 20 7946 0000.",
    ],
    [
      "phone",
      "too long as typed",
      "0803 123 4567                     1",
      "Enter a phone number like 0803 123 4567, or with a country code like +44 20 7946 0000.",
    ],
    ["services", "missing", undefined, "Choose at least one service."],
    ["services", "empty", [], "Choose at least one service."],
    ["services", "an unknown value", ["BRANDING"], "Choose services from the list."],
    ["services", "a repeat", ["WEB_APP", "WEB_APP"], "Choose each service only once."],
    ["budgetRange", "missing", undefined, 'Choose a budget range, or "Not sure yet".'],
    ["budgetRange", "empty", "", 'Choose a budget range, or "Not sure yet".'],
    ["budgetRange", "an unknown value", "1000000", "Choose a budget range from the list."],
    ["timeline", "missing", undefined, 'Choose a timeline, or "Flexible / not sure".'],
    ["timeline", "empty", " ", 'Choose a timeline, or "Flexible / not sure".'],
    ["timeline", "an unknown value", "YESTERDAY", "Choose a timeline from the list."],
    [
      "projectNotes",
      "missing",
      undefined,
      "Tell us a little about your project (at least 10 characters).",
    ],
    [
      "projectNotes",
      "too short",
      "  Hi there  ",
      "Tell us a little about your project (at least 10 characters).",
    ],
    [
      "projectNotes",
      "too long",
      "n".repeat(5001),
      "Project details must be at most 5,000 characters.",
    ],
    [
      "projectNotes",
      "a control character",
      "Product shoot\u0000 for our line.",
      "Project details contain characters we can't accept.",
    ],
    [
      "consent",
      "missing",
      undefined,
      "Please agree to the privacy notice so we can keep your details.",
    ],
    ["consent", "false", false, "Please agree to the privacy notice so we can keep your details."],
    [
      "consent",
      "a string",
      "on",
      "Please agree to the privacy notice so we can keep your details.",
    ],
  ])("%s: refuses %s", (field, _, value, message) => {
    const issues = issuesFor({ ...full, [field]: value });
    expect(issues.map((issue) => issue.message)).toEqual([message]);
    expect(issues[0].path[0]).toBe(field);
  });

  it("reports every invalid field at once", () => {
    const issues = issuesFor({});
    expect(new Set(issues.map((issue) => issue.path[0]))).toEqual(
      new Set([
        "clientName",
        "email",
        "phone",
        "services",
        "projectTypes",
        "budgetRange",
        "timeline",
        "projectNotes",
        "consent",
      ]),
    );
  });

  it("allows line breaks and tabs in the project notes", () => {
    const notes = "Scope:\n\t- a website\r\n\t- a launch video";
    expect(inquiryInputSchema.parse({ ...minimal, projectNotes: notes }).projectNotes).toBe(notes);
  });
});

describe("inquiryInputSchema: project types (Phase 19 spec, D1, D3)", () => {
  const typesIssues = (services: string[], projectTypes: unknown) =>
    issuesFor({ ...full, services, projectTypes }).map((issue) => [issue.path[0], issue.message]);

  it("accepts several types per service, in any order", () => {
    const projectTypes = ["VIDEOGRAPHY.SOCIAL", "PHOTOGRAPHY.EVENT", "VIDEOGRAPHY.EVENT"];
    expect(
      inquiryInputSchema.parse({ ...full, services: ["PHOTOGRAPHY", "VIDEOGRAPHY"], projectTypes })
        .projectTypes,
    ).toEqual(projectTypes);
  });

  it.each([
    ["missing", undefined],
    ["not a list", "PHOTOGRAPHY.EVENT"],
    ["an unknown id", ["PHOTOGRAPHY.WEDDING"]],
    ["a service name, not a type", ["PHOTOGRAPHY"]],
    ["a repeat", ["PHOTOGRAPHY.EVENT", "PHOTOGRAPHY.EVENT"]],
    ["a type of a service not chosen", ["PHOTOGRAPHY.EVENT", "WEB_APP.SHOP"]],
    ["far too many", Array.from({ length: 40 }, () => "PHOTOGRAPHY.EVENT")],
  ])("refuses %s", (_, projectTypes) => {
    expect(typesIssues(["PHOTOGRAPHY"], projectTypes)).toEqual([
      ["projectTypes", "Choose project types from the list."],
    ]);
  });

  it("asks for at least one type for each chosen service, naming it", () => {
    expect(typesIssues(["PHOTOGRAPHY", "WEB_APP", "DIGITAL_MARKETING"], ["WEB_APP.SHOP"])).toEqual([
      ["projectTypes", "Choose at least one kind of project for Photography."],
      ["projectTypes", "Choose at least one kind of project for Digital Marketing."],
    ]);
  });

  it('refuses "Not sure yet" with other types of the same service', () => {
    expect(
      typesIssues(
        ["WEB_APP", "PHOTOGRAPHY"],
        ["WEB_APP.NOT_SURE", "WEB_APP.SHOP", "PHOTOGRAPHY.NOT_SURE"],
      ),
    ).toEqual([
      [
        "projectTypes",
        'For Web & App Development, choose "Not sure yet" or the kinds that apply, not both.',
      ],
    ]);
  });

  it("checks project types even when other fields are invalid", () => {
    const issues = issuesFor({ ...full, email: "ada@", projectTypes: [] });
    expect(issues.map((issue) => issue.path[0])).toEqual([
      "email",
      "projectTypes",
      "projectTypes",
      "projectTypes",
    ]);
  });
});

describe("toE164 (D6)", () => {
  it.each([
    ["a Nigerian local number", "0803 123 4567", "+2348031234567"],
    ["a local number with hyphens", "0802-658-1200", "+2348026581200"],
    ["234 without the plus", "2348031234567", "+2348031234567"],
    ["+234", "+234 803 123 4567", "+2348031234567"],
    ["+234 with the trunk zero", "+234 (0)803 123 4567", "+2348031234567"],
    ["a UK number", "+44 20 7946 0000", "+442079460000"],
    ["a US number with dots", "+1.415.555.0100", "+14155550100"],
    ["the shortest international number", "+12345678", "+12345678"],
    ["the longest international number", "+123456789012345", "+123456789012345"],
  ])("accepts %s", (_, input, e164) => {
    expect(toE164(input)).toBe(e164);
  });

  it.each([
    ["letters", "0803 CALL ME"],
    ["a plus in the middle", "0803+1234567"],
    ["a local number one digit short", "0803 123 456"],
    ["a local number one digit long", "0803 123 45678"],
    ["an international number without a plus", "44 20 7946 0000"],
    ["a +234 number one digit short", "+234 803 123 456"],
    ["a +234 number one digit long", "+234 803 123 45678"],
    ["a country code starting with 0", "+0123456789"],
    ["too few digits", "+1234567"],
    ["too many digits", "+1234567890123456"],
    ["only punctuation", "+() -"],
  ])("refuses %s", (_, input) => {
    expect(toE164(input)).toBeNull();
  });
});

describe("toInquiryData (D7)", () => {
  const now = new Date("2026-10-20T09:00:00.000Z");

  it("maps a minimal inquiry, with null for the absent company and consent stamped now", () => {
    expect(toInquiryData(inquiryInputSchema.parse(minimal), now)).toEqual({
      clientName: "Ada Obi",
      companyName: null,
      email: "ada@example.com",
      phone: "+2348031234567",
      services: ["PHOTOGRAPHY"],
      projectTypes: ["PHOTOGRAPHY.NOT_SURE"],
      budgetRange: "NOT_SURE",
      timeline: "FLEXIBLE",
      projectNotes: "Product shoot for our new skincare line.",
      consentAt: now,
    });
  });

  it("maps a full inquiry and never sets server-owned fields", () => {
    const data = toInquiryData(inquiryInputSchema.parse({ ...full, status: "CLOSED" }), now);
    expect(data).toMatchObject({
      companyName: "Glow Labs Ltd",
      projectTypes: full.projectTypes,
      budgetRange: "FROM_1_5M_TO_5M",
      timeline: "ONE_TO_THREE_MONTHS",
      consentAt: now,
    });
    for (const key of ["id", "status", "emailSentAt", "ackSentAt", "createdAt", "updatedAt"])
      expect(data).not.toHaveProperty(key);
  });
});

describe("enum values match the Prisma schema (D8)", () => {
  it.each([
    ["ServiceCategory", serviceCategories, ServiceCategory],
    ["InquiryStatus", inquiryStatuses, InquiryStatus],
    ["BudgetRange", budgetRanges, BudgetRange],
    ["InquiryTimeline", inquiryTimelines, InquiryTimeline],
  ])("%s", (_, tuple, prismaEnum) => {
    expect([...tuple]).toEqual(Object.values(prismaEnum));
  });
});
