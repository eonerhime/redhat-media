// Image slots staff can replace (Phase 28 spec, D2, D4): the image equivalent of
// content/defaults.ts. With no MediaItem row, a slot shows its default, which is never destroyed
// (D10). A later slot is one entry here plus its layout.

import type { Aspect } from "./cloudinary";

/** What a slot shows: a public ID under rhm/… and its alt text. */
export type SlotImage = { publicId: string; alt: string };

type SlotDefinition = {
  /** MediaItem.ownerType; the slot key is its ownerId. */
  owner: "PAGE";
  /** Uploads go to {folder}/{env}/{random} (D6). */
  folder: string;
  aspect: Aspect;
  /** The <img> sizes attribute for the slot's layout. */
  sizes: string;
  default: SlotImage;
};

export const MEDIA_SLOTS = {
  "home.hero": {
    owner: "PAGE",
    folder: "rhm/page/home-hero",
    aspect: "4/5",
    // The hero's right column from lg (2/5 of the 72rem container), capped at max-w-md below.
    sizes: "(min-width: 1152px) 440px, (min-width: 1024px) 40vw, (min-width: 480px) 448px, 100vw",
    // A stand-in until the owner's photo is uploaded to rhm/page/home-hero/default (D2).
    default: {
      publicId: "rhm/page/dev-media/sample",
      alt: "Green rolling hills and trees under an evening sky",
    },
  },
} as const satisfies Record<string, SlotDefinition>;

export type MediaSlot = keyof typeof MEDIA_SLOTS;

export function isMediaSlot(slot: unknown): slot is MediaSlot {
  return typeof slot === "string" && Object.hasOwn(MEDIA_SLOTS, slot);
}
