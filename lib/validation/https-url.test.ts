import { describe, expect, it } from "vitest";
import { checkHttpsUrl, httpsUrlSchema, isHttpsUrl, MAX_URL_LENGTH } from "./https-url";

describe("checkHttpsUrl (Phase 9 spec, D2)", () => {
  it.each([
    ["a bare domain", "https://sportspred.ng", "https://sportspred.ng/"],
    ["a subdomain", "https://hireflow-track.vercel.app", "https://hireflow-track.vercel.app/"],
    [
      "a path",
      "https://github.com/eonerhime/hireflow-track",
      "https://github.com/eonerhime/hireflow-track",
    ],
    ["a query and hash", "https://example.com/a?b=1#c", "https://example.com/a?b=1#c"],
    ["an upper-case scheme and host", "HTTPS://Example.COM/A", "https://example.com/A"],
    ["surrounding whitespace", "  https://example.com  ", "https://example.com/"],
    ["the default port", "https://example.com:443/", "https://example.com/"],
    ["an internationalised domain", "https://bücher.example/", "https://xn--bcher-kva.example/"],
  ])("accepts %s", (_, input, href) => {
    expect(checkHttpsUrl(input)).toEqual({ ok: true, url: href });
  });

  const scheme = "Links must start with https://";
  const domain = "Links must point to a public domain name.";

  it.each([
    ["empty", "", "Enter a link."],
    ["whitespace only", "   ", "Enter a link."],
    ["http:", "http://example.com", scheme],
    ["javascript:", "javascript:alert(1)", scheme],
    ["data:", "data:text/html,<script>alert(1)</script>", scheme],
    ["protocol-relative", "//example.com", scheme],
    ["a relative path", "/portfolio", scheme],
    ["no scheme", "example.com", scheme],
    ["ftp:", "ftp://example.com", scheme],
    ["a backslash after the scheme", "https:\\\\example.com", scheme],
    ["a missing slash", "https:/example.com", scheme],
    ["a username", "https://user@example.com", "Links cannot contain a username or password."],
    ["a password", "https://user:pass@example.com", "Links cannot contain a username or password."],
    ["a port", "https://example.com:8443/", "Links cannot include a port."],
    ["an IPv4 literal", "https://127.0.0.1/", domain],
    ["an IPv4 in hex", "https://0x7f.0.0.1/", domain],
    ["an IPv6 literal", "https://[::1]/", domain],
    ["localhost", "https://localhost/", domain],
    ["a .localhost name", "https://app.localhost/", domain],
    ["a single-label host", "https://intranet/", domain],
    [
      "a space inside",
      "https://example.com/a b",
      "Links cannot contain spaces or control characters.",
    ],
    [
      "a newline inside",
      "https://example.com/\nx",
      "Links cannot contain spaces or control characters.",
    ],
    ["a tab inside", "https://exa\tmple.com", "Links cannot contain spaces or control characters."],
    ["an empty host label", "https://example..com/", "This is not a valid link."],
    ["an underscore in the host", "https://exa_mple.com/", "This is not a valid link."],
    ["a label starting with a hyphen", "https://-example.com/", "This is not a valid link."],
    ["a trailing dot", "https://example.com./", "This is not a valid link."],
    ["an unparseable URL", "https://exa mple.com".replace(" ", "%"), "This is not a valid link."],
    [
      "more than 2,048 characters",
      `https://example.com/${"a".repeat(MAX_URL_LENGTH)}`,
      "Links must be at most 2,048 characters.",
    ],
  ])("rejects %s", (_, input, error) => {
    expect(checkHttpsUrl(input)).toEqual({ ok: false, error });
    expect(isHttpsUrl(input)).toBe(false);
  });
});

describe("httpsUrlSchema", () => {
  it("outputs the normalised href", () => {
    expect(httpsUrlSchema.parse(" https://Example.com ")).toBe("https://example.com/");
  });

  it("fails with the rule's message", () => {
    const result = httpsUrlSchema.safeParse("http://example.com");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Links must start with https://");
  });
});
