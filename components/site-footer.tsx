import { cacheLife } from "next/cache";
import Link from "next/link";
import { block } from "@/lib/content/block";
import { contact, siteName } from "@/lib/site";
import { EditButton } from "@/components/cms/edit-button";

// A bare `new Date()` fails prerendering under cacheComponents (Phase 1 spec, D10).
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function SiteFooter() {
  const [year, privacy] = await Promise.all([currentYear(), block("footer.privacy")]);
  return (
    <footer className="border-t border-line">
      <div className="container-page flex flex-col gap-6 py-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-xl font-extrabold">{siteName}</p>
          <address className="mt-3 flex flex-col gap-2 not-italic sm:flex-row sm:flex-wrap sm:gap-x-6">
            <a href={`mailto:${contact.email}`} className="underline underline-offset-4">
              {contact.email}
            </a>
            <a href={contact.phoneHref} className="underline underline-offset-4">
              {contact.phoneDisplay}
            </a>
            <span>{contact.location}</span>
          </address>
        </div>
        {/* muted stays at 16px on ink (specs/tech-stack.md → Design tokens). */}
        <div className="flex flex-col gap-2 md:items-end">
          {/* The privacy notice (Phase 18 spec, D11). */}
          <Link href="/privacy" className="underline underline-offset-4">
            {privacy}
          </Link>
          <EditButton blockKey="footer.privacy" value={privacy} />
          <p className="text-base text-muted">
            {contact.registration} · © {year} {siteName}
          </p>
        </div>
      </div>
    </footer>
  );
}
