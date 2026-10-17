import type { Metadata } from "next";
import { PortfolioListing } from "@/components/portfolio/portfolio-grid";

// Fixture page for the portfolio states a real database rarely shows (Phase 10 spec, D10):
// empty and unavailable, side by side. The ready state is /portfolio itself.

export const metadata: Metadata = { title: "Portfolio states | Dev" };

export default function DevPortfolioStatesPage() {
  return (
    <div className="space-y-12">
      <h1 className="font-display text-3xl font-extrabold">Portfolio states</h1>
      <section aria-labelledby="empty-state" className="space-y-4">
        <h2 id="empty-state" className="text-xl font-bold">
          Empty
        </h2>
        <PortfolioListing result={{ ok: true, cards: [] }} />
      </section>
      <section aria-labelledby="unavailable-state" className="space-y-4">
        <h2 id="unavailable-state" className="text-xl font-bold">
          Unavailable
        </h2>
        <PortfolioListing result={{ ok: false }} />
      </section>
    </div>
  );
}
