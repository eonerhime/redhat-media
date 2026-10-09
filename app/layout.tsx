import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RedHat Media",
  description: "If it's media, it's ours to handle.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
