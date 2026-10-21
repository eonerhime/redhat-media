// The client acknowledgment (Phase 20 spec, D5, Appendix B). Only the fixed choices the visitor
// made appear here, never free text: anyone can type someone else's address into the form.

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
import * as s from "./styles";

export type ClientAckProps = {
  /** "Service: Type" lines, in the order chosen. */
  scope: string[];
  budget: string;
  timeline: string;
  phoneDisplay: string;
  phoneHref: string;
  registration: string;
  location: string;
  siteHost: string;
  privacyUrl: string;
};

export function ClientAck(props: ClientAckProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>We reply within one working day.</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Heading as="h1" style={s.heading}>
            Thanks — we&apos;ve received your inquiry
          </Heading>
          <Text style={s.text}>We reply within one working day.</Text>
          <Heading as="h2" style={s.subheading}>
            What you asked about
          </Heading>
          <ul style={s.list}>
            {props.scope.map((line) => (
              <li key={line} style={s.listItem}>
                {line}
              </li>
            ))}
          </ul>
          <Text style={s.text}>
            <strong>Budget:</strong> {props.budget}
            <br />
            <strong>Timeline:</strong> {props.timeline}
          </Text>
          <Text style={s.text}>
            If anything has changed, just reply to this email or call us on{" "}
            <Link href={props.phoneHref} style={s.link}>
              {props.phoneDisplay}
            </Link>
            .
          </Text>
          <Hr style={s.rule} />
          <Text style={s.footer}>
            RedHat Media · {props.registration} · {props.location}
          </Text>
          <Text style={s.footer}>
            You&apos;re receiving this because this address was entered on the inquiry form at{" "}
            {props.siteHost}. If that wasn&apos;t you, you can ignore this email. We&apos;ll only
            use your address to reply to this inquiry.{" "}
            <Link href={props.privacyUrl} style={s.link}>
              Privacy notice
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
