import "server-only";

import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";
import type { CloudinaryAdmin } from "./attach-core";
import type { Signer } from "./sign-core";

// The site's Cloudinary credentials, passed per call rather than through the SDK's global config
// (Phase 28 spec, D6, D11). The secret stays on the server: only signatures leave it (C5).

function credentials() {
  const cloudName = env.cloudinaryCloudName;
  const api = env.cloudinaryApi;
  return cloudName && api
    ? { cloud_name: cloudName, api_key: api.apiKey, api_secret: api.apiSecret }
    : undefined;
}

/** Signs upload parameters; undefined when the key, secret or cloud name is missing. */
export function cloudinarySigner(): Signer | undefined {
  const creds = credentials();
  if (!creds) return undefined;
  return {
    cloudName: creds.cloud_name,
    apiKey: creds.api_key,
    sign: (params) => cloudinary.utils.api_sign_request(params, creds.api_secret),
  };
}

/** The Admin API calls attachMedia and removeMedia make; undefined when not configured. */
export function cloudinaryAdmin(): CloudinaryAdmin | undefined {
  const creds = credentials();
  if (!creds) return undefined;
  return {
    resource: (publicId) => cloudinary.api.resource(publicId, { ...creds, resource_type: "image" }),
    destroy: (publicId) =>
      cloudinary.uploader.destroy(publicId, { ...creds, resource_type: "image", invalidate: true }),
  };
}
