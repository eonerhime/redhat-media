"use client";

import QRCode from "qrcode";
import { useMemo } from "react";

const QUIET_ZONE = 4; // modules of white margin that scanners expect

/** The dark modules of a QR code as one SVG path, one 1×1 square each. */
export function qrPath(text: string): { size: number; d: string } {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  let d = "";
  for (let row = 0; row < modules.size; row++)
    for (let col = 0; col < modules.size; col++)
      if (modules.get(row, col)) d += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
  return { size: modules.size + QUIET_ZONE * 2, d };
}

// The TOTP set-up QR code (Phase 24 spec, D7). Drawn as React SVG from the
// module matrix: no injected HTML, no data: URL, so no CSP change. Always dark
// on white, which every scanner reads, whatever the site theme.
export function TotpQr({ uri, label }: { uri: string; label: string }) {
  const { size, d } = useMemo(() => qrPath(uri), [uri]);
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      className="size-60 max-w-full rounded-md"
    >
      <rect width={size} height={size} fill="#ffffff" />
      <path d={d} fill="#000000" />
    </svg>
  );
}
