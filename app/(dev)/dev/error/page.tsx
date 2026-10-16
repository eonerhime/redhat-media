import type { Metadata } from "next";
import { ThrowOnce } from "./throw-once";

// Fixture page for the root error boundary, app/error.tsx: the (dev) group has none of its own
// (Phase 15 spec, D2). Off in production, like every /dev page.

export const metadata: Metadata = { title: "Error boundary | Dev" };

export default function DevErrorPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold">Error boundary</h1>
      <ThrowOnce />
    </div>
  );
}
