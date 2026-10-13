"use client";

// CldImage passes a loader function to next/image, so it must render on the
// client. Only <MediaImage> imports this (Phase 8 spec, D5, D10).
import { CldImage as NextCldImage, type CldImageProps } from "next-cloudinary";

// Returning false from onError stops CldImage's retry, which polls
// res.cloudinary.com with fetch() for assets still processing after an upload.
// Our public IDs exist before they are rendered, and the fetch would break
// connect-src 'self'.
const skipProcessingRetry = () => false;

export function CldImage(props: CldImageProps) {
  return <NextCldImage {...props} onError={skipProcessingRetry} />;
}
