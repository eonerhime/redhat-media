import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { VercelInsights } from "./vercel-insights";

// Phase 15 spec, D3: the scripts exist only on Vercel deployments.
describe("<VercelInsights>", () => {
  it("renders nothing off Vercel", () => {
    expect(VercelInsights({ enabled: false })).toBeNull();
  });

  it("renders Analytics and Speed Insights on Vercel", () => {
    const fragment = VercelInsights({ enabled: true }) as ReactElement<{
      children: ReactElement[];
    }>;
    expect(fragment.props.children.map((child) => child.type)).toEqual([Analytics, SpeedInsights]);
  });
});
