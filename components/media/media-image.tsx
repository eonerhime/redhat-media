import { getImageProps, type ImageLoader } from "next/image";
import { preload as preloadImage } from "react-dom";
import { env } from "@/lib/env";
import { getBlurDataUrl } from "@/lib/media/blur";
import { blurStyle } from "@/lib/media/blur-core";
import {
  fillUrl,
  heightFor,
  IMAGE_WIDTH,
  isRhmPublicId,
  limitUrl,
  type Aspect,
} from "@/lib/media/cloudinary";

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
 * It renders a plain <img> on the server from next/image's getImageProps, with no client
 * component, so a page of images adds no JavaScript and nothing to hydrate (Phase 16
 * amendment to Phase 8 D5).
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
    // Fill mode with a limit crop: Cloudinary scales the image to each srcset width and never
    // crops it, and object-contain fits it in the parent's box.
    const loader: ImageLoader = ({ width }) => limitUrl(cloudName, publicId, width);
    const { props: img } = getImageProps({
      src: publicId,
      alt,
      fill: true,
      sizes,
      loader,
      preload,
    });
    if (preload) preloadImage(img.src, imageHints(img));
    return (
      // eslint-disable-next-line @next/next/no-img-element -- next/image's own props, rendered on the server
      <img {...img} alt={alt} className={["object-contain", className].filter(Boolean).join(" ")} />
    );
  }

  const { aspect } = props;
  const height = heightFor(aspect);
  const loader: ImageLoader = ({ width }) => fillUrl(cloudName, publicId, aspect, width);
  const { props: img } = getImageProps({
    src: publicId,
    alt,
    width: IMAGE_WIDTH,
    height,
    sizes,
    loader,
    preload,
    fetchPriority: preload ? "high" : undefined,
  });
  const blurDataURL = await getBlurDataUrl(cloudName, publicId, aspect);
  if (preload) preloadImage(img.src, imageHints(img));

  return (
    // eslint-disable-next-line @next/next/no-img-element -- next/image's own props, rendered on the server
    <img
      {...img}
      alt={alt}
      style={
        blurDataURL ? { ...img.style, ...blurStyle(blurDataURL, IMAGE_WIDTH, height) } : img.style
      }
      className={["h-auto w-full", className].filter(Boolean).join(" ")}
    />
  );
}

/** What next/image's own preload sends: the srcset and sizes, at high priority. */
function imageHints(img: { srcSet?: string; sizes?: string }) {
  return {
    as: "image",
    imageSrcSet: img.srcSet,
    imageSizes: img.sizes,
    fetchPriority: "high",
  } as const;
}
