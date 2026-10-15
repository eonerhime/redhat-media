import { describe, expect, it } from "vitest";
import {
  portfolioItemJsonLd,
  serializeJsonLd,
  serviceJsonLd,
  type PortfolioJsonLdInput,
} from "./json-ld";

const input = {
  name: "Web & App Development",
  description: "Websites and web apps built to work as hard as you do.",
  slug: "web-app-development",
  siteName: "RedHat Media",
  siteUrl: "https://redhat-media.vercel.app",
};

describe("serializeJsonLd()", () => {
  const hostile = serviceJsonLd({
    ...input,
    description: `</script><script>alert(1)</script> <!-- x --> a<b & "c" 'd'`,
  });

  it("writes no `<`, so nothing can close the script tag or open a comment", () => {
    const out = serializeJsonLd(hostile);
    expect(out).not.toContain("<");
    expect(out).toContain("\\u003c/script>");
  });

  it("parses back to the same value", () => {
    expect(JSON.parse(serializeJsonLd(hostile))).toEqual(hostile);
  });
});

describe("serviceJsonLd()", () => {
  it("builds a Service with an absolute URL and the site as provider", () => {
    expect(serviceJsonLd(input)).toEqual({
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Web & App Development",
      description: "Websites and web apps built to work as hard as you do.",
      serviceType: "Web & App Development",
      url: "https://redhat-media.vercel.app/services/web-app-development",
      provider: {
        "@type": "Organization",
        name: "RedHat Media",
        url: "https://redhat-media.vercel.app",
      },
    });
  });
});

describe("portfolioItemJsonLd() (Phase 12 spec, D10)", () => {
  const item: PortfolioJsonLdInput = {
    name: "HireFlow",
    description: "A job application tracker, built in public with specs.",
    slug: "hireflow-track",
    genre: "Web & App Development",
    keywords: ["Next.js 15", "TypeScript"],
    credit: "Design & Engineering: Emo Onerhime",
    datePublished: "2026-10-13",
    image: "https://res.cloudinary.com/demo/image/upload/rhm/portfolio_item/a/cover",
    liveUrl: "https://hireflow-track.vercel.app/",
    videos: [],
    siteName: "RedHat Media",
    siteUrl: "https://redhat-media.vercel.app",
  };

  it("builds a CreativeWork with an absolute URL and RedHat Media as creator", () => {
    expect(portfolioItemJsonLd(item)).toEqual({
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: "HireFlow",
      description: "A job application tracker, built in public with specs.",
      url: "https://redhat-media.vercel.app/portfolio/hireflow-track",
      image: "https://res.cloudinary.com/demo/image/upload/rhm/portfolio_item/a/cover",
      datePublished: "2026-10-13",
      genre: "Web & App Development",
      keywords: "Next.js 15, TypeScript",
      creditText: "Design & Engineering: Emo Onerhime",
      creator: {
        "@type": "Organization",
        name: "RedHat Media",
        url: "https://redhat-media.vercel.app",
      },
      sameAs: "https://hireflow-track.vercel.app/",
    });
  });

  it("leaves out empty fields instead of sending null", () => {
    const out = portfolioItemJsonLd({
      ...item,
      keywords: [],
      credit: null,
      datePublished: null,
      image: null,
      liveUrl: null,
    });
    for (const key of ["keywords", "creditText", "datePublished", "image", "sameAs", "video"])
      expect(out).not.toHaveProperty(key);
  });

  it("adds a VideoObject per video, with uploadDate only when it is known", () => {
    const out = portfolioItemJsonLd({
      ...item,
      videos: [
        {
          name: "Walkthrough",
          description: "A tour of the pipeline.",
          thumbnailUrl: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
          embedUrl: "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
          contentUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        },
        {
          name: "Launch",
          description: "Launch day.",
          thumbnailUrl: null,
          embedUrl: "https://player.vimeo.com/video/1084537",
          contentUrl: "https://vimeo.com/1084537",
          uploadDate: "2026-01-02",
        },
      ],
    });
    expect(out.video).toEqual([
      {
        "@type": "VideoObject",
        name: "Walkthrough",
        description: "A tour of the pipeline.",
        thumbnailUrl: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
        embedUrl: "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
        contentUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
      },
      {
        "@type": "VideoObject",
        name: "Launch",
        description: "Launch day.",
        embedUrl: "https://player.vimeo.com/video/1084537",
        contentUrl: "https://vimeo.com/1084537",
        uploadDate: "2026-01-02",
      },
    ]);
  });

  it("serialises database text without a `<`", () => {
    const out = serializeJsonLd(portfolioItemJsonLd({ ...item, description: "</script><b>" }));
    expect(out).not.toContain("<");
  });
});
