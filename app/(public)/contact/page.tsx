import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CopyEmail } from "@/components/contact/copy-email";
import { ButtonLink } from "@/components/shared/button-link";
import { ExternalLink } from "@/components/shared/external-link";
import { block } from "@/lib/content/block";
import { contact, mailtoHref, siteName } from "@/lib/site";

// Static: no database, cookies or headers (Phase 13 spec, D1, C2). Title as on /about until
// Phase 14 adds a template.
export async function generateMetadata(): Promise<Metadata> {
  const [heading, description] = await Promise.all([
    block("contact.heading"),
    block("contact.meta.description"),
  ]);
  return { title: `${heading} | ${siteName}`, description };
}

// Each contact link is a ≥ 44px tap target and wraps rather than overflowing at 360px (D4).
const contactLink =
  "inline-flex min-h-11 items-center text-lg font-semibold wrap-anywhere underline decoration-brand decoration-2 underline-offset-4";

// The About pillar card surface (Phase 6 spec, D4); muted text stays ≥ 16px on ink.
function ChannelCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className="flex flex-col rounded-xl border border-t-4 border-line border-t-brand bg-ink p-6">
      <h3 className="font-display text-xl font-extrabold">{label}</h3>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </li>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-base text-muted">{children}</p>;
}

export default async function Contact() {
  const [heading, intro, button, subject] = await Promise.all([
    block("contact.heading"),
    block("contact.intro"),
    block("contact.email.button"),
    block("contact.email.subject"),
  ]);
  const [channels, email, phone, whatsapp, location] = await Promise.all([
    block("contact.channels.heading"),
    Promise.all([
      block("contact.email.label"),
      block("contact.email.note"),
      block("contact.email.copy"),
      block("contact.email.copied"),
    ]),
    Promise.all([
      block("contact.phone.label"),
      block("contact.phone.note"),
      block("contact.phone.international"),
    ]),
    Promise.all([
      block("contact.whatsapp.label"),
      block("contact.whatsapp.link"),
      block("contact.whatsapp.note"),
    ]),
    Promise.all([
      block("contact.location.label"),
      block("contact.location.note"),
      block("contact.hours.label"),
    ]),
  ]);
  const [next, brief] = await Promise.all([
    Promise.all(
      (
        [
          "contact.next.heading",
          "contact.next.send",
          "contact.next.reply",
          "contact.next.scope",
        ] as const
      ).map((key) => block(key)),
    ),
    Promise.all(
      (
        [
          "contact.brief.heading",
          "contact.brief.intro",
          "contact.brief.service",
          "contact.brief.goal",
          "contact.brief.timeline",
          "contact.brief.budget",
          "contact.brief.examples",
          "contact.brief.services",
        ] as const
      ).map((key) => block(key)),
    ),
  ]);
  const [nextHeading, ...steps] = next;
  const [briefHeading, briefIntro, ...briefRest] = brief;
  const briefItems = briefRest.slice(0, -1);
  const servicesLink = briefRest[briefRest.length - 1];

  return (
    <>
      <section className="container-page py-16 md:py-24">
        <h1 className="max-w-4xl font-display text-display-1 font-black tracking-tight">
          {heading}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">{intro}</p>
        <div className="mt-10">
          <ButtonLink href={mailtoHref(subject)}>{button}</ButtonLink>
        </div>
      </section>

      <section aria-labelledby="contact-channels" className="container-page pb-16">
        <h2 id="contact-channels" className="sr-only">
          {channels}
        </h2>
        <address className="not-italic">
          <ul className="grid gap-6 md:grid-cols-2">
            <ChannelCard label={email[0]}>
              <a href={mailtoHref()} className={contactLink}>
                {contact.email}
              </a>
              <Note>{email[1]}</Note>
              <CopyEmail email={contact.email} label={email[2]} copiedLabel={email[3]} />
            </ChannelCard>
            <ChannelCard label={phone[0]}>
              <a href={contact.phoneHref} className={contactLink}>
                {contact.phoneDisplay}
              </a>
              <Note>{phone[1]}</Note>
              <p className="mt-2 text-base text-muted">{phone[2]}</p>
              <a href={contact.phoneHref} className={contactLink}>
                {contact.phoneInternational}
              </a>
            </ChannelCard>
            <ChannelCard label={whatsapp[0]}>
              <ExternalLink href={contact.whatsappHref} className={contactLink}>
                {whatsapp[1]}
              </ExternalLink>
              <Note>{whatsapp[2]}</Note>
            </ChannelCard>
            <ChannelCard label={location[0]}>
              <p className="text-lg font-semibold">{contact.location}</p>
              <Note>{location[1]}</Note>
              <p className="mt-2 text-base text-muted">{location[2]}</p>
              <p className="text-lg font-semibold">{contact.hours}</p>
            </ChannelCard>
          </ul>
        </address>
      </section>

      <div className="container-page grid gap-6 border-t border-line py-16 lg:grid-cols-2">
        <section
          aria-labelledby="contact-next"
          className="rounded-xl border border-line bg-ink p-6 md:p-8"
        >
          <h2 id="contact-next" className="font-display text-2xl font-extrabold">
            {nextHeading}
          </h2>
          <ol className="mt-6 list-decimal space-y-3 pl-6 text-lg marker:font-bold marker:text-brand">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        <section
          aria-labelledby="contact-brief"
          className="rounded-xl border border-line bg-ink p-6 md:p-8"
        >
          <h2 id="contact-brief" className="font-display text-2xl font-extrabold">
            {briefHeading}
          </h2>
          <p className="mt-4 text-base text-muted">{briefIntro}</p>
          <ul className="mt-6 list-disc space-y-3 pl-5 text-lg marker:text-brand">
            {briefItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-6">
            <Link
              href="/services"
              className="inline-flex min-h-11 items-center font-semibold underline decoration-brand decoration-2 underline-offset-4"
            >
              {servicesLink}
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
