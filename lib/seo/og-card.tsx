// Open Graph share cards, 1200 × 630 PNG (Phase 14 spec, D3). ImageResponse ships with Next, and
// next/font cannot feed it, so Archivo is read from assets/fonts/ (OFL). Every word on a card is
// keyed copy, site data or database content, never new text. Colours are the design tokens.
// Each card resolves to PNG bytes, so lib/seo/og-images.ts can cache it and the image routes
// prerender (Cache Components stops a prerender at uncached I/O).

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const INK = "#1a1a1a";
const FG = "#f5f5f5";
const MUTED = "#808285";
const BRAND = "#ed1c24";
const LINE = "#2e2e2e";

const fontsPromise = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/Archivo-Medium.ttf")),
  readFile(join(process.cwd(), "assets/fonts/Archivo-ExtraBold.ttf")),
]).then(([medium, extraBold]) => [
  { name: "Archivo", data: medium, weight: 500 as const, style: "normal" as const },
  { name: "Archivo", data: extraBold, weight: 800 as const, style: "normal" as const },
]);

// The header's light-on-dark logo (480 × 275), which is made for the ink background.
const logoPromise = readFile(join(process.cwd(), "public/brand/logo.png")).then(
  (png) => `data:image/png;base64,${png.toString("base64")}`,
);

async function render(content: React.ReactElement): Promise<Uint8Array> {
  const image = new ImageResponse(content, { ...OG_SIZE, fonts: await fontsPromise });
  return new Uint8Array(await image.arrayBuffer());
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: INK,
        color: FG,
        fontFamily: "Archivo",
        borderTop: `12px solid ${BRAND}`,
      }}
    >
      {children}
    </div>
  );
}

/** The site card: logo, tagline and location. */
export async function siteCard({ tagline, location }: { tagline: string; location: string }) {
  const logo = await logoPromise;
  return render(
    <Frame>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flexGrow: 1,
          padding: "0 80px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
        <img src={logo} width={384} height={220} alt="" />
        <div style={{ marginTop: 36, fontSize: 60, fontWeight: 800, lineHeight: 1.1 }}>
          {tagline}
        </div>
        <div style={{ marginTop: 20, fontSize: 32, fontWeight: 500, color: MUTED }}>{location}</div>
      </div>
    </Frame>,
  );
}

/** A service card: pillar, service name and summary. */
export async function serviceCard({
  pillar,
  name,
  summary,
}: {
  pillar: string;
  name: string;
  summary: string;
}) {
  const logo = await logoPromise;
  return render(
    <Frame>
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "64px 80px" }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: MUTED,
          }}
        >
          {pillar}
        </div>
        <div style={{ marginTop: 20, fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>{name}</div>
        <div style={{ marginTop: 28, fontSize: 34, fontWeight: 500, lineHeight: 1.3 }}>
          {summary}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "0 80px 48px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
        <img src={logo} width={192} height={110} alt="" />
      </div>
    </Frame>,
  );
}

/** A portfolio card: the cover screenshot with the title and category on an ink band. */
export async function portfolioCard({
  cover,
  title,
  category,
}: {
  /** A data URL of the 1200 × 630 cover (fetched by the caller, so a failure falls back). */
  cover: string;
  title: string;
  category: string;
}) {
  const logo = await logoPromise;
  return render(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: INK,
        fontFamily: "Archivo",
        color: FG,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
      <img src={cover} width={1200} height={630} alt="" style={{ position: "absolute" }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "28px 56px",
          background: INK,
          borderTop: `8px solid ${BRAND}`,
          boxShadow: `0 -1px 0 ${LINE}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 860 }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            {category}
          </div>
          <div style={{ marginTop: 8, fontSize: 60, fontWeight: 800, lineHeight: 1.05 }}>
            {title}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
        <img src={logo} width={192} height={110} alt="" />
      </div>
    </div>,
  );
}
