import { ImageResponse } from "next/og";

// Generated favicon until a logo file exists (Phase 1 spec, D1).
// ImageResponse cannot read CSS variables, so the token values are repeated here.
const FG = "#f5f5f5"; // --color-fg
const BRAND_DEEP = "#d0181f"; // --color-brand-deep

// iOS masks the Apple touch icon itself, so it is drawn full-bleed (rounded: false).
export function brandIcon(size: number, { rounded }: { rounded: boolean }) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_DEEP,
        color: FG,
        fontSize: size * 0.5,
        fontWeight: 900,
        letterSpacing: -size * 0.02,
        borderRadius: rounded ? size * 0.18 : 0,
      }}
    >
      RH
    </div>,
    { width: size, height: size },
  );
}
