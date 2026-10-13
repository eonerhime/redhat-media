import { env } from "@/lib/env";
import { getBlurDataUrl } from "@/lib/media/blur";
import { heightFor, IMAGE_WIDTH, isRhmPublicId, type Aspect } from "@/lib/media/cloudinary";
import { CldImage } from "./cld-image";

type MediaImageProps = {
  /** Cloudinary public ID under rhm/{portfolio_item|service|page}/…; never a URL. */
  publicId: string;
  /** Pass "" only for decorative images. */
  alt: string;
  aspect: Aspect;
  /** e.g. "(min-width: 1024px) 50vw, 100vw" */
  sizes: string;
  /** Only for the page's LCP image; every other image is lazy. */
  preload?: boolean;
  className?: string;
};

/**
 * A Cloudinary image cropped to `aspect`, with responsive widths, automatic
 * format and quality, and a blur placeholder (Phase 8 spec, D5, D6).
 *
 * @example <MediaImage publicId="rhm/page/home/hero" alt="Studio shoot" aspect="16/9" sizes="100vw" preload />
 */
export async function MediaImage({
  publicId,
  alt,
  aspect,
  sizes,
  preload = false,
  className,
}: MediaImageProps) {
  if (!isRhmPublicId(publicId)) {
    throw new Error(`<MediaImage> needs an rhm/… public ID, got: ${publicId}`);
  }
  const cloudName = env.cloudinaryCloudName;
  if (!cloudName) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set (see .env.example)");
  }
  const blurDataURL = await getBlurDataUrl(cloudName, publicId, aspect);

  return (
    <CldImage
      src={publicId}
      alt={alt}
      width={IMAGE_WIDTH}
      height={heightFor(aspect)}
      sizes={sizes}
      // CldImage adds f_auto by default; a format prop would leak onto the <img>.
      crop="fill"
      gravity="auto"
      quality="auto"
      config={{ cloud: { cloudName } }}
      preload={preload}
      fetchPriority={preload ? "high" : undefined}
      placeholder={blurDataURL ? "blur" : "empty"}
      blurDataURL={blurDataURL}
      className={["h-auto w-full", className].filter(Boolean).join(" ")}
    />
  );
}
