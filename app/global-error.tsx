"use client";

import { ErrorView } from "@/components/shared/error-view";
import { errorCopy, siteName } from "@/lib/site";
import { fontVariables } from "./fonts";
import "./globals.css";

// Errors in the root layout. This replaces the root layout, so it brings its own <html>, <body>,
// styles and fonts; metadata exports do not apply here, hence the <title> (Phase 15 spec, D2).
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <title>{`${errorCopy.heading} | ${siteName}`}</title>
        <main id="main" className="flex-1">
          <ErrorView onRetry={retry} home />
        </main>
      </body>
    </html>
  );
}
