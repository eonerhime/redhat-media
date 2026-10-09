import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";

// Self-hosted at build time, so the CSP keeps font-src 'self' (Phase 1 spec, D2).
const archivo = Archivo({ subsets: ["latin"], display: "swap", variable: "--font-archivo" });
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "RedHat Media",
  description: "If it's media, it's ours to handle.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#1a1a1a", // --color-ink
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
