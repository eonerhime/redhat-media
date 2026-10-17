import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Vercel Web Analytics and Speed Insights, on Vercel deployments only (Phase 15 spec, D3): `next
// start` locally and in CI serves no /_vercel/* scripts, and `pnpm dev` would load a debug script
// from a host the CSP does not allow. On Vercel both load from the site's own origin.
export function VercelInsights({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
