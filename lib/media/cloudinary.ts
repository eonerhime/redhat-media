// Cloudinary public-ID rules and image geometry (Phase 8 spec, D5, D6).
// The database stores public IDs, never URLs (tech-stack.md → Core).

/** `rhm/{ownerType}/…`; full URLs never match, so no image URL can point anywhere else. */
const RHM_PUBLIC_ID = /^rhm\/(portfolio_item|service|page)\/[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/;

export function isRhmPublicId(id: string): boolean {
  return RHM_PUBLIC_ID.test(id);
}

/** The slots images are cropped to, so layout never shifts (D5). */
export const ASPECTS = {
  "16/9": [16, 9],
  // The seeded portfolio covers are 1200×750 (Phase 10 spec, D4).
  "16/10": [16, 10],
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

/** A full-size delivery URL, for places that need an absolute image URL, such as JSON-LD. */
export function deliveryUrl(cloudName: string, publicId: string): string {
  if (!isRhmPublicId(publicId)) throw new Error(`Not an rhm/ public ID: ${publicId}`);
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_limit,w_${IMAGE_WIDTH}/f_auto,q_auto/${publicId}`;
}

/** A 1200 × 630 JPEG crop for the portfolio share card (Phase 14 spec, D3). */
export function ogCoverUrl(cloudName: string, publicId: string): string {
  if (!isRhmPublicId(publicId)) throw new Error(`Not an rhm/ public ID: ${publicId}`);
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,g_auto,w_1200,h_630/q_auto,f_jpg/${publicId}`;
}

/**
 * One srcset rendition for `<MediaImage>`: the `aspect` crop at `width`. The URL is the one
 * next-cloudinary's CldImage built before Phase 16 (height floored from the 1600 px slot,
 * `v1/` before the ID), so Cloudinary keeps serving the derivatives it already has.
 */
export function fillUrl(
  cloudName: string,
  publicId: string,
  aspect: Aspect,
  width: number,
): string {
  if (!isRhmPublicId(publicId)) throw new Error(`Not an rhm/ public ID: ${publicId}`);
  const height = Math.floor((heightFor(aspect) * width) / IMAGE_WIDTH);
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_${width},h_${height},g_auto/f_auto/q_auto/v1/${publicId}`;
}

/** One srcset rendition of the whole image, scaled down to `width` and never cropped. */
export function limitUrl(cloudName: string, publicId: string, width: number): string {
  if (!isRhmPublicId(publicId)) throw new Error(`Not an rhm/ public ID: ${publicId}`);
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_limit,w_${width}/f_auto/q_auto/v1/${publicId}`;
}
