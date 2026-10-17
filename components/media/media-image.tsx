import { env } from "@/lib/env";
import { getBlurDataUrl } from "@/lib/media/blur";
import { heightFor, IMAGE_WIDTH, isRhmPublicId, type Aspect } from "@/lib/media/cloudinary";
import { CldImage } from "./cld-image";

type CommonProps = {
  /** Cloudinary public ID under rhm/{portfolio_item|service|page}/…; never a URL. */
  publicId: string;
  /** Pass "" only for decorative images. */
  alt: string;
  /** e.g. "(min-width: 1024px) 50vw, 100vw" */
  sizes: string;
  /** Only for the page's LCP image; every other image is lazy. */
  preload?: boolean;
  className?: string;
};

type MediaImageProps =
  | (CommonProps & { aspect: Aspect; fit?: "cover" })
  /**
   * The whole image, uncropped, scaled to fit its parent, which must be positioned and sized.
   * Only the portfolio lightbox uses it (Phase 12 spec, D6).
   */
  | (CommonProps & { fit: "contain"; aspect?: never });

/**
 * A Cloudinary image cropped to `aspect`, with responsive widths, automatic
 * format and quality, and a blur placeholder (Phase 8 spec, D5, D6).
 *
 * @example <MediaImage publicId="rhm/page/home/hero" alt="Studio shoot" aspect="16/9" sizes="100vw" preload />
 */
export async function MediaImage(props: MediaImageProps) {
  const { publicId, alt, sizes, preload = false, className } = props;
  if (!isRhmPublicId(publicId)) {
    throw new Error(`<MediaImage> needs an rhm/… public ID, got: ${publicId}`);
  }
  const cloudName = env.cloudinaryCloudName;
  if (!cloudName) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set (see .env.example)");
  }

  if (props.fit === "contain") {
    // next/image fill mode, with CldImage's default limit crop: Cloudinary scales the image to
    // each srcset width and never crops it, and object-contain fits it in the parent's box.
    return (
      <CldImage
        src={publicId}
        alt={alt}
        fill
        sizes={sizes}
        quality="auto"
        config={{ cloud: { cloudName } }}
        preload={preload}
        className={["object-contain", className].filter(Boolean).join(" ")}
      />
    );
  }

  const { aspect } = props;
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
