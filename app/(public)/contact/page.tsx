import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { submitInquiry } from "./actions";
import { CopyEmail } from "@/components/contact/copy-email";
import {
  inquiryChoices,
  inquiryFormCopy,
  inquiryServiceOption,
} from "@/components/contact/inquiry-copy";
import { InquiryForm } from "@/components/contact/inquiry-form";
import { ButtonLink } from "@/components/shared/button-link";
import { ExternalLink } from "@/components/shared/external-link";
import { JsonLd } from "@/components/shared/json-ld";
import { block, type BlockKey } from "@/lib/content/block";
import { visibleServices } from "@/lib/content/services";
import { env } from "@/lib/env";
import { businessJsonLdInput } from "@/lib/seo/business";
import { localBusinessJsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { contact, mailtoHref, siteName } from "@/lib/site";
import { Editable } from "@/components/cms/editable";
import { EditButton } from "@/components/cms/edit-button";

// Static: no database, cookies or headers (Phase 13 spec, D1, C2). Title as on /about.
export async function generateMetadata(): Promise<Metadata> {
  const [heading, description] = await Promise.all([
    block("contact.heading"),
    block("contact.meta.description"),
  ]);
  return pageMetadata({ title: `${heading} | ${siteName}`, description, path: "/contact" });
}

// Each contact link is a ≥ 44px tap target and wraps rather than overflowing at 360px (D4).
const contactLink =
  "inline-flex min-h-11 items-center text-lg font-semibold wrap-anywhere underline decoration-brand decoration-2 underline-offset-4";

// The About pillar card surface (Phase 6 spec, D4); muted text stays ≥ 16px on ink.
function ChannelCard({
  labelKey,
  label,
  children,
}: {
  labelKey: BlockKey;
  label: string;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-col rounded-xl border border-t-4 border-line border-t-brand bg-ink p-6">
      <h3 className="font-display text-xl font-extrabold">
        <Editable blockKey={labelKey} value={label} />
      </h3>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </li>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-base text-muted">{children}</p>;
}

const NEXT_KEYS = [
  "contact.next.heading",
  "contact.next.send",
  "contact.next.reply",
  "contact.next.scope",
] as const;

const BRIEF_KEYS = [
  "contact.brief.heading",
  "contact.brief.intro",
  "contact.brief.service",
  "contact.brief.goal",
  "contact.brief.timeline",
  "contact.brief.budget",
  "contact.brief.examples",
  "contact.brief.services",
] as const;

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
    Promise.all(NEXT_KEYS.map((key) => block(key))),
    Promise.all(BRIEF_KEYS.map((key) => block(key))),
  ]);
  // The inquiry form, behind its switch (Phase 18 spec, D1, D10). Read at build time: the page
  // stays static, and with the switch off it renders exactly as before.
  const inquiry = env.inquiryForm;
  const form = inquiry
    ? await Promise.all([
        block("contact.form.heading"),
        block("contact.form.intro"),
        inquiryFormCopy(),
        inquiryChoices(),
        visibleServices().then((list) => Promise.all(list.map(inquiryServiceOption))),
      ]).then(([formHeading, formIntro, copy, choices, services]) => ({
        formHeading,
        formIntro,
        copy,
        choices,
        services,
        turnstileSiteKey: inquiry.turnstileSiteKey,
      }))
    : undefined;
  const [nextHeading, ...steps] = next;
  const [briefHeading, briefIntro, ...briefRest] = brief;
  const briefItems = briefRest.slice(0, -1);
  const servicesLink = briefRest[briefRest.length - 1];

  const channelCards = (
    <section
      aria-labelledby="contact-channels"
      className={form ? undefined : "container-page pb-16"}
    >
      <h2 id="contact-channels" className="sr-only">
        {channels}
      </h2>
      <address className="not-italic">
        {/* Beside the form from lg, the cards stack in its third of the row (D1). */}
        <ul
          className={
            form ? "grid gap-6 md:grid-cols-2 lg:grid-cols-1" : "grid gap-6 md:grid-cols-2"
          }
        >
          <ChannelCard labelKey="contact.email.label" label={email[0]}>
            <a href={mailtoHref()} className={contactLink}>
              {contact.email}
            </a>
            <Note>
              <Editable blockKey="contact.email.note" value={email[1]} />
            </Note>
            <CopyEmail email={contact.email} label={email[2]} copiedLabel={email[3]} />
            <EditButton blockKey="contact.email.copy" value={email[2]} />
          </ChannelCard>
          <ChannelCard labelKey="contact.phone.label" label={phone[0]}>
            <a href={contact.phoneHref} className={contactLink}>
              {contact.phoneDisplay}
            </a>
            <Note>
              <Editable blockKey="contact.phone.note" value={phone[1]} />
            </Note>
            <p className="mt-2 text-base text-muted">
              <Editable blockKey="contact.phone.international" value={phone[2]} />
            </p>
            <a href={contact.phoneHref} className={contactLink}>
              {contact.phoneInternational}
            </a>
          </ChannelCard>
          <ChannelCard labelKey="contact.whatsapp.label" label={whatsapp[0]}>
            <ExternalLink href={contact.whatsappHref} className={contactLink}>
              {whatsapp[1]}
            </ExternalLink>
            <EditButton blockKey="contact.whatsapp.link" value={whatsapp[1]} />
            <Note>
              <Editable blockKey="contact.whatsapp.note" value={whatsapp[2]} />
            </Note>
          </ChannelCard>
          <ChannelCard labelKey="contact.location.label" label={location[0]}>
            <p className="text-lg font-semibold">{contact.location}</p>
            <Note>
              <Editable blockKey="contact.location.note" value={location[1]} />
            </Note>
            <p className="mt-2 text-base text-muted">
              <Editable blockKey="contact.hours.label" value={location[2]} />
            </p>
            <p className="text-lg font-semibold">{contact.hours}</p>
          </ChannelCard>
        </ul>
      </address>
    </section>
  );

  return (
    <>
      <JsonLd data={localBusinessJsonLd(businessJsonLdInput())} />
      <section className="container-page py-16 md:py-24">
        <h1 className="max-w-4xl font-display text-display-1 font-black tracking-tight">
          <Editable blockKey="contact.heading" value={heading} />
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          <Editable blockKey="contact.intro" value={intro} />
        </p>
        <div className="mt-10">
          <ButtonLink href={mailtoHref(subject)}>{button}</ButtonLink>
          <EditButton blockKey="contact.email.button" value={button} />
        </div>
      </section>

      {form ? (
        // D1: directly after the header; from lg the form takes two thirds of the row.
        <div className="container-page grid gap-10 pb-16 lg:grid-cols-3">
          <section aria-labelledby="contact-form" className="lg:col-span-2">
            <h2 id="contact-form" className="font-display text-display-2 font-black tracking-tight">
              {form.formHeading}
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-muted">{form.formIntro}</p>
            <div className="mt-8">
              <InquiryForm
                action={submitInquiry}
                copy={form.copy}
                choices={form.choices}
                services={form.services}
                turnstileSiteKey={form.turnstileSiteKey}
              />
            </div>
          </section>
          {channelCards}
        </div>
      ) : (
        channelCards
      )}

      <div className="container-page grid gap-6 border-t border-line py-16 lg:grid-cols-2">
        <section
          aria-labelledby="contact-next"
          className="rounded-xl border border-line bg-ink p-6 md:p-8"
        >
          <h2 id="contact-next" className="font-display text-2xl font-extrabold">
            <Editable blockKey="contact.next.heading" value={nextHeading} />
          </h2>
          <ol className="mt-6 list-decimal space-y-3 pl-6 text-lg marker:font-bold marker:text-brand">
            {steps.map((step, i) => (
              <li key={NEXT_KEYS[i + 1]}>
                <Editable blockKey={NEXT_KEYS[i + 1]} value={step} />
              </li>
            ))}
          </ol>
        </section>
        <section
          aria-labelledby="contact-brief"
          className="rounded-xl border border-line bg-ink p-6 md:p-8"
        >
          <h2 id="contact-brief" className="font-display text-2xl font-extrabold">
            <Editable blockKey="contact.brief.heading" value={briefHeading} />
          </h2>
          <p className="mt-4 text-base text-muted">
            <Editable blockKey="contact.brief.intro" value={briefIntro} />
          </p>
          <ul className="mt-6 list-disc space-y-3 pl-5 text-lg marker:text-brand">
            {briefItems.map((item, i) => (
              <li key={BRIEF_KEYS[i + 2]}>
                <Editable blockKey={BRIEF_KEYS[i + 2]} value={item} />
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <Link
              href="/services"
              className="inline-flex min-h-11 items-center font-semibold underline decoration-brand decoration-2 underline-offset-4"
            >
              {servicesLink}
            </Link>
            <EditButton blockKey="contact.brief.services" value={servicesLink} />
          </p>
        </section>
      </div>
    </>
  );
}
