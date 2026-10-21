// The team notification (Phase 20 spec, D4, Appendix A). Every value arrives as plain text and
// React escapes it; the only links are the client's validated email and E.164 phone.

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";
import { Fragment } from "react";
import * as s from "./styles";

export type TeamNotificationProps = {
  clientName: string;
  companyName: string | null;
  email: string;
  /** E.164, e.g. +2348026581200. */
  phone: string;
  /** "Service: Type" lines, in the order chosen. */
  scope: string[];
  budget: string;
  timeline: string;
  projectNotes: string;
  /** e.g. "Tue 20 Oct 2026, 14:05 WAT". */
  receivedAt: string;
  reference: string;
  siteHost: string;
};

/** `mailto:` for a Zod-validated address; the `@` stays readable. */
const mailto = (email: string) => `mailto:${encodeURIComponent(email).replace("%40", "@")}`;

export function TeamNotification(props: TeamNotificationProps) {
  const { clientName, companyName, email, phone, scope, budget, timeline } = props;
  return (
    <Html lang="en">
      <Head />
      <Preview>New inquiry from the website</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Heading as="h1" style={s.heading}>
            New inquiry from the website
          </Heading>
          <Text style={s.text}>
            <strong>Name:</strong> {clientName}
            <br />
            <strong>Company:</strong> {companyName ?? "—"}
            <br />
            <strong>Email:</strong>{" "}
            <Link href={mailto(email)} style={s.link}>
              {email}
            </Link>
            <br />
            <strong>Phone:</strong>{" "}
            <Link href={`tel:${phone}`} style={s.link}>
              {phone}
            </Link>
          </Text>
          <Heading as="h2" style={s.subheading}>
            Services
          </Heading>
          <ul style={s.list}>
            {scope.map((line) => (
              <li key={line} style={s.listItem}>
                {line}
              </li>
            ))}
          </ul>
          <Text style={s.text}>
            <strong>Budget:</strong> {budget}
            <br />
            <strong>Timeline:</strong> {timeline}
          </Text>
          <Heading as="h2" style={s.subheading}>
            Project details
          </Heading>
          {/* <br> per line, so the plain-text version keeps the breaks too. */}
          <Text style={s.notes}>
            {props.projectNotes.split(/\r?\n/).map((line, index) => (
              <Fragment key={index}>
                {index > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </Text>
          <Hr style={s.rule} />
          <Text style={s.footer}>
            Received {props.receivedAt} · Reference {props.reference}
          </Text>
          <Text style={s.footer}>
            Reply to the client directly at {email}. This message was sent by {props.siteHost} when
            the inquiry form was submitted.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
