// Turns a saved inquiry into the two emails (Phase 20 spec, D4, D5, D7): labels resolved through
// block() so they match the site, then each template rendered to HTML and plain text. Subjects are
// fixed text plus server values only (spec C2).

import { createElement } from "react";
import { render } from "@react-email/components";
import { BUDGET_KEYS, TIMELINE_KEYS } from "@/components/contact/inquiry-copy";
import { isProjectTypeId } from "@/content/project-types";
import { services } from "@/content/services";
import { block } from "@/lib/content/block";
import { projectTypeLabel } from "@/lib/content/project-types";
import type { InquiryData } from "@/lib/inquiry/submit-core";
import { contact } from "@/lib/site";
import { ClientAck } from "./templates/client-ack";
import { TeamNotification } from "./templates/team-notification";

export type RenderedEmail = { subject: string; html: string; text: string };

export type InquiryEmailInput = {
  id: string;
  data: InquiryData;
  receivedAt: Date;
  siteUrl: string;
};

export const ACK_SUBJECT = "We've received your inquiry — RedHat Media";

/** "Tue 20 Oct 2026, 14:05 WAT": Lagos time, the team's clock. */
export function formatLagosTime(date: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Lagos",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.weekday} ${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute} WAT`;
}

/** The team notification's subject: the time keeps Gmail from threading every inquiry together. */
export const teamSubject = (receivedAt: Date) => `New inquiry · ${formatLagosTime(receivedAt)}`;

/**
 * "Service: Type" for each chosen type, grouped by service in the order chosen (Phase 19: a type
 * shown outside its group carries its service name). A service with no type shows its name alone.
 */
async function scopeLines(data: InquiryData): Promise<string[]> {
  const lines: string[] = [];
  for (const category of data.services) {
    const ids = data.projectTypes.filter(
      (id) => isProjectTypeId(id) && id.startsWith(`${category}.`),
    );
    if (ids.length === 0) {
      const service = services.find((entry) => entry.category === category);
      if (service) lines.push(await block(service.nameKey));
      continue;
    }
    for (const id of ids) {
      if (!isProjectTypeId(id)) continue;
      const { service, type } = await projectTypeLabel(id);
      lines.push(`${service}: ${type}`);
    }
  }
  return lines;
}

async function scope(data: InquiryData) {
  const [lines, budget, timeline] = await Promise.all([
    scopeLines(data),
    block(BUDGET_KEYS[data.budgetRange]),
    block(TIMELINE_KEYS[data.timeline]),
  ]);
  return { scope: lines, budget, timeline };
}

// In plain text, a phone or email link is its own text; only web links show their URL.
const plainText = {
  plainText: true,
  htmlToTextOptions: {
    selectors: [
      { selector: 'a[href^="tel:"]', format: "anchor", options: { ignoreHref: true } },
      { selector: 'a[href^="mailto:"]', format: "anchor", options: { ignoreHref: true } },
    ],
  },
} as const;

async function both(element: ReturnType<typeof createElement>) {
  const [html, text] = await Promise.all([render(element), render(element, plainText)]);
  return { html, text };
}

/** @example const { subject, html, text } = await renderTeamNotification({ id, data, receivedAt, siteUrl }); */
export async function renderTeamNotification(input: InquiryEmailInput): Promise<RenderedEmail> {
  const { id, data, receivedAt, siteUrl } = input;
  const element = createElement(TeamNotification, {
    clientName: data.clientName,
    companyName: data.companyName,
    email: data.email,
    phone: data.phone,
    ...(await scope(data)),
    projectNotes: data.projectNotes,
    receivedAt: formatLagosTime(receivedAt),
    reference: id,
    siteHost: new URL(siteUrl).host,
  });
  return { subject: teamSubject(receivedAt), ...(await both(element)) };
}

/** Takes only the fixed choices: the acknowledgment never carries free text (D5). */
export async function renderClientAck(input: InquiryEmailInput): Promise<RenderedEmail> {
  const { data, siteUrl } = input;
  const element = createElement(ClientAck, {
    ...(await scope(data)),
    phoneDisplay: contact.phoneDisplay,
    phoneHref: contact.phoneHref,
    registration: contact.registration,
    location: contact.location,
    siteHost: new URL(siteUrl).host,
    privacyUrl: `${siteUrl}/privacy`,
  });
  return { subject: ACK_SUBJECT, ...(await both(element)) };
}
