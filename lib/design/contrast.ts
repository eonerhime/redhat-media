// WCAG 2.x contrast (https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio).

export type Rgba = { r: number; g: number; b: number; a: number };

/** Normal text needs 4.5:1; large text and UI parts need 3:1. */
export const TEXT_MIN_RATIO = 4.5;
export const LARGE_TEXT_MIN_RATIO = 3;
export const UI_MIN_RATIO = 3;

/** Parses `#rgb`, `#rrggbb`, `rgb()` and `rgba()`. Anything else throws, so unknown colours fail loudly. */
export function parseColor(input: string): Rgba {
  const value = input.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(value);
  if (hex) {
    const digits =
      hex[1].length === 3
        ? [...hex[1]].map((d) => d + d)
        : [hex[1].slice(0, 2), hex[1].slice(2, 4), hex[1].slice(4, 6)];
    const [r, g, b] = digits.map((d) => parseInt(d, 16));
    return { r, g, b, a: 1 };
  }
  const fn = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(
    value,
  );
  if (fn) {
    const alpha =
      fn[4] === undefined ? 1 : fn[4].endsWith("%") ? parseFloat(fn[4]) / 100 : parseFloat(fn[4]);
    return { r: Number(fn[1]), g: Number(fn[2]), b: Number(fn[3]), a: alpha };
  }
  throw new Error(`Unsupported colour: ${input}`);
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance({ r, g, b }: Rgba): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Blends a translucent foreground over an opaque background. */
function flatten(fg: Rgba, bg: Rgba): Rgba {
  const mix = (f: number, b: number) => f * fg.a + b * (1 - fg.a);
  return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b), a: 1 };
}

export function contrastRatio(foreground: string, background: string): number {
  const bg = parseColor(background);
  if (bg.a !== 1) throw new Error(`Background must be opaque: ${background}`);
  const fg = flatten(parseColor(foreground), bg);
  const [light, dark] = [relativeLuminance(fg), relativeLuminance(bg)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Large text is ≥ 24px, or ≥ 18.66px (14pt) at weight 700+. */
export function isLargeText(fontSizePx: number, fontWeight: number): boolean {
  return fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700);
}

export function requiredTextRatio(fontSizePx: number, fontWeight: number): number {
  return isLargeText(fontSizePx, fontWeight) ? LARGE_TEXT_MIN_RATIO : TEXT_MIN_RATIO;
}
