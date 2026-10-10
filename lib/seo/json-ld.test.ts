import { describe, expect, it } from "vitest";
import { serializeJsonLd, serviceJsonLd } from "./json-ld";

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
