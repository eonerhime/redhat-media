import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ItemList } from "@/components/services/item-list";
import { RelatedWork } from "@/components/services/related-work";
import { Cta } from "@/components/shared/cta";
import { JsonLd } from "@/components/shared/json-ld";
import { StepList } from "@/components/shared/step-list";
import { block } from "@/lib/content/block";
import { allServiceSlugs, pillarOf, visibleServiceBySlug } from "@/lib/content/services";
import { env } from "@/lib/env";
import { serviceJsonLd } from "@/lib/seo/json-ld";
import { siteName } from "@/lib/site";

// All six slugs are prerendered, muted ones as a 404, so unmuting needs no redeploy. Any other
// slug finds no visible service and 404s through notFound() too (Architectural rules 3; Phase 5
// spec, D1). `dynamicParams` is not available with cacheComponents.
export function generateStaticParams() {
  return allServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]">): Promise<Metadata> {
  const service = await visibleServiceBySlug((await params).slug);
  if (!service) notFound();
  const [name, description] = await Promise.all([
    block(service.nameKey),
    block(service.summaryKey),
  ]);
  return { title: `${name} | ${siteName}`, description };
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const service = await visibleServiceBySlug((await params).slug);
  if (!service) notFound();
  const pillar = pillarOf(service);
  const [pillarName, name, summary, processHeading] = await Promise.all([
    block(pillar.nameKey),
    block(service.nameKey),
    block(service.summaryKey),
    block("home.process.heading"),
  ]);
  return (
    <>
      <JsonLd
        data={serviceJsonLd({
          name,
          description: summary,
          slug: service.slug,
          siteName,
          siteUrl: env.siteUrl,
        })}
      />
      <section className="container-page py-16 md:py-24">
        {/* muted stays at ≥ 16px on ink (tech-stack.md → Design tokens). */}
        <p className="text-base font-semibold tracking-widest text-muted uppercase">{pillarName}</p>
        <h1 className="mt-4 max-w-4xl font-display text-display-1 font-black tracking-tight">
          {name}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">{summary}</p>
      </section>
      <div className="container-page grid gap-6 border-t border-line py-16 md:grid-cols-2">
        <ItemList
          id="included"
          headingKey="services.detail.included"
          itemKeys={service.includedKeys}
        />
        <ItemList
          id="deliverables"
          headingKey="services.detail.deliverables"
          itemKeys={service.deliverableKeys}
        />
      </div>
      <section
        aria-labelledby="process-heading"
        className="container-page border-t border-line py-16"
      >
        <h2 id="process-heading" className="font-display text-display-2 font-extrabold">
          {processHeading}
        </h2>
        <StepList pillar={pillar} className="mt-6 text-xl" />
      </section>
      <RelatedWork category={service.category} />
      <div className="border-t border-line">
        <Cta />
      </div>
    </>
  );
}
