import type { Metadata, Viewport } from "next";
import { env } from "@/lib/env";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  // Every relative metadata URL resolves on the deployment's own origin (Phase 14 spec, D1).
  metadataBase: new URL(env.siteUrl),
  title: "RedHat Media",
  description: "If it's media, it's ours to handle.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#1a1a1a", // --color-ink
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
