import { describe, expect, it } from "vitest";
import { noindexMetadata, pageMetadata } from "./metadata";

describe("pageMetadata() (Phase 14 spec, D1, D2)", () => {
  const input = { title: "About | RedHat Media", description: "Who we are.", path: "/about" };

  it("sends title, description, canonical, Open Graph and a large Twitter card", () => {
    expect(pageMetadata(input)).toEqual({
      title: "About | RedHat Media",
      description: "Who we are.",
      alternates: { canonical: "/about" },
      openGraph: {
        title: "About | RedHat Media",
        description: "Who we are.",
        url: "/about",
        siteName: "RedHat Media",
        type: "website",
        locale: "en_NG",
      },
      twitter: {
        card: "summary_large_image",
        title: "About | RedHat Media",
        description: "Who we are.",
      },
    });
  });

  it("leaves the canonical out when asked (/portfolio)", () => {
    const out = pageMetadata({ ...input, path: "/portfolio", canonical: false });
    expect(out).not.toHaveProperty("alternates");
    expect(out.openGraph).toMatchObject({ url: "/portfolio" });
  });

  it("never sets images, so the opengraph-image files supply them", () => {
    expect(pageMetadata(input).openGraph).not.toHaveProperty("images");
    expect(pageMetadata(input).twitter).not.toHaveProperty("images");
  });
});

describe("noindexMetadata()", () => {
  it("keeps the page out of the index and sends no canonical", () => {
    expect(noindexMetadata("Portfolio | RedHat Media")).toEqual({
      title: "Portfolio | RedHat Media",
      robots: { index: false },
    });
  });
});
