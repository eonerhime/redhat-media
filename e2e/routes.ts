import { services } from "../content/services";
import { resolveVisibility } from "../lib/content/services";

// Every built public page. The shell spec gives each the layout and contrast checks (Phase 4 spec,
// D6), including each visible service page (Phase 5 spec, D8), /about (Phase 6 spec, D9),
// /portfolio (Phase 10 spec, D10), a filtered /portfolio (Phase 11 spec, D9), a portfolio item
// (Phase 12 spec, D13) and /contact (Phase 13 spec, D8). The contact spec walks the same list
// for its "every CTA leads to /contact" check.
export const routes = [
  "/",
  "/services",
  ...resolveVisibility(services).map((s) => `/services/${s.slug}`),
  "/about",
  "/portfolio",
  "/portfolio?category=web-apps",
  "/portfolio/sportspred",
  "/contact",
];
