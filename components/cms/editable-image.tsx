import { MediaImage } from "@/components/media/media-image";
import { mediaSlot } from "@/lib/media/read";
import { MEDIA_SLOTS, type MediaSlot } from "@/lib/media/slots";
import { ImageEditor } from "./image-editor";

// An image staff can replace (Phase 28 spec, D3; tech-stack.md → In-place CMS 5). The image
// renders on the server, exactly as before, and the client <ImageEditor> adds the ✎ and its
// dialog only for an editor with editing on, so a visitor's HTML doesn't change.

/** The image in force for `slot`, with its ✎ for editors. `preload` only for the LCP image. */
export async function EditableImage({ slot, preload }: { slot: MediaSlot; preload?: boolean }) {
  const image = await mediaSlot(slot);
  const { aspect, sizes, default: fallback } = MEDIA_SLOTS[slot];
  return (
    <ImageEditor slot={slot} image={image} hasUpload={image.publicId !== fallback.publicId}>
      <MediaImage
        publicId={image.publicId}
        alt={image.alt}
        aspect={aspect}
        sizes={sizes}
        preload={preload}
      />
    </ImageEditor>
  );
}
