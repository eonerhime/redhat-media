import { LARGE_TEXT_MIN_RATIO, TEXT_MIN_RATIO, UI_MIN_RATIO } from "./contrast";

export type ColorToken = "brand" | "brand-deep" | "ink" | "fg" | "muted" | "line";

export type TokenPairing = {
  fg: ColorToken;
  bg: ColorToken;
  min: number;
  use: string;
};

/**
 * Every token pairing the UI may use (specs/tech-stack.md → Design tokens).
 * `line` is decorative only and has no pairing.
 */
export const tokenPairings: readonly TokenPairing[] = [
  { fg: "fg", bg: "ink", min: TEXT_MIN_RATIO, use: "body text and headings" },
  { fg: "muted", bg: "ink", min: TEXT_MIN_RATIO, use: "secondary text ≥ 16px" },
  { fg: "brand", bg: "ink", min: LARGE_TEXT_MIN_RATIO, use: "wordmark and large accents" },
  { fg: "brand", bg: "ink", min: UI_MIN_RATIO, use: "focus ring" },
  { fg: "fg", bg: "brand-deep", min: TEXT_MIN_RATIO, use: "button labels" },
  { fg: "brand-deep", bg: "ink", min: UI_MIN_RATIO, use: "button edge" },
  { fg: "ink", bg: "fg", min: TEXT_MIN_RATIO, use: "skip link" },
];

/** Reads `--color-<name>: <value>;` declarations from the `@theme` block of a stylesheet. */
export function readThemeColors(css: string): Map<string, string> {
  const theme = /@theme\s*\{([\s\S]*?)\}/.exec(css);
  if (!theme) throw new Error("No @theme block found");
  const colors = new Map<string, string>();
  for (const [, name, value] of theme[1].matchAll(/--color-([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    if (value.trim() !== "initial") colors.set(name, value.trim());
  }
  return colors;
}
