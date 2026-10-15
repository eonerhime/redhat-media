# Validation — Phase 14 SEO + CSP enforced

## Roadmap success check ("Done when", verbatim)

> Rich-results and OG validators pass. The enforced CSP raises no console violations across every template, and securityheaders.com rates the site A or better.

- [ ] **Rich results:** Google's Rich Results Test reports valid `Organization` (`/`), `LocalBusiness` (`/contact`), `Service` (a service page) and `CreativeWork` (a portfolio item) with no errors (D6, D11)
- [ ] **Open Graph:** an OG validator shows title, description and the 1200 × 630 image for `/`, a service page and a portfolio item (D1, D3)
- [ ] **No CSP violations:** `csp.spec.ts` passes on every template in CI and on the Vercel preview, including the lightbox and both video facades (D8, D11)
- [ ] **securityheaders.com:** grade A or better on the preview (or computed from the served headers, with the production re-run moved to Phase 16) (D11)

## SEO behaviour

- [ ] Every public route sends a canonical URL for its path, except `/portfolio`; unknown and unavailable pages send `noindex` and no canonical (D2)
- [ ] `og:image` URLs are absolute on the deployment's own origin and answer `image/png` at 1200 × 630 (D1, D3)
- [ ] The service and portfolio cards fall back to the site card for a muted, unknown or coverless item, or a failed read (D3)
- [ ] `sitemap.xml` lists visible services and published items only, never `/dev`, `/cms`, filtered views or muted services, and survives a failed portfolio read (D4)
- [ ] `robots.txt` has the sitemap URL and no `Disallow` lines (D5)
- [ ] Structured data matches `lib/site.ts` and claims nothing the site does not show (D6, C6)

## CSP

- [ ] The SRI result and the D7 decision are recorded in `implementation.md` and `tech-stack.md` (D7)
- [ ] One enforced policy; no report-only header; no `'unsafe-eval'` or wildcard outside `pnpm dev` (D8); `preview-headers` confirms it on the deployment
- [ ] Vercel Toolbar handled per owner answer C (D9)

## Soft 404

- [ ] Unknown-slug status re-checked on Next 16.4 and handled per owner answer D (D10)

## Gates

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass
- [ ] Route table unchanged apart from the new metadata routes (C2)
- [ ] `pnpm test:e2e` passes locally (ready and unavailable) and in CI; `preview-e2e` passes on the Vercel preview
- [ ] `pnpm test:db` passes (no schema change; the CI `db` job)
- [ ] Owner check on the preview
