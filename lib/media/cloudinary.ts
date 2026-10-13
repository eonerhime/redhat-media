// Cloudinary public-ID rules and image geometry (Phase 8 spec, D5, D6).
// The database stores public IDs, never URLs (tech-stack.md → Core).

/** `rhm/{ownerType}/…`; full URLs never match, so CldImage cannot proxy them. */
const RHM_PUBLIC_ID = /^rhm\/(portfolio_item|service|page)\/[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/;

export function isRhmPublicId(id: string): boolean {
  return RHM_PUBLIC_ID.test(id);
}

/** The slots images are cropped to, so layout never shifts (D5). */
export const ASPECTS = {
  "16/9": [16, 9],
  "4/3": [4, 3],
  "3/2": [3, 2],
  "1/1": [1, 1],
  "3/4": [3, 4],
  "4/5": [4, 5],
} as const satisfies Record<string, readonly [number, number]>;

export type Aspect = keyof typeof ASPECTS;

/** Width of the largest rendition; Cloudinary scales down for each srcset entry. */
export const IMAGE_WIDTH = 1600;

export function heightFor(aspect: Aspect, width = IMAGE_WIDTH): number {
  const [w, h] = ASPECTS[aspect];
  return Math.round((width * h) / w);
}

/** A ≤ 10 px JPEG of the same crop, for the blur placeholder (D5). */
export function blurImageUrl(cloudName: string, publicId: string, aspect: Aspect): string {
  if (!isRhmPublicId(publicId)) throw new Error(`Not an rhm/ public ID: ${publicId}`);
  const [w, h] = ASPECTS[aspect];
  return `https://res.cloudinary.com/${cloudName}/image/upload/ar_${w}:${h},c_fill,g_auto,w_10/q_auto:low,f_jpg/${publicId}`;
}
