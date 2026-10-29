// The upload rules the browser checks first and the server checks again (Phase 28 spec, D5, D9).
// No server imports, so components/cms/image-editor.tsx can use them.

/** The formats a signed upload accepts, as Cloudinary reports them (D5, D6). */
export const UPLOAD_FORMATS = ["jpg", "png", "webp", "avif"] as const;

/** The same four as the file picker's MIME types. */
export const UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

/** D5: checked in the browser first, and again from Cloudinary's record in attachMedia. */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** D9: alt text is 1–150 characters on one line. */
export const ALT_MAX = 150;

// Generic messages only: the editor sees why an action failed, never anything internal.
export const mediaErrors = {
  refused: "You can't edit this. Sign in again as an editor.",
  rateLimited: "Too many changes. Try again in a few minutes.",
  notEditable: "This image can't be edited.",
  notConfigured: "Image uploads aren't set up here.",
  altRequired: "Describe the image in the alt text.",
  altTooLong: `Keep the alt text to ${ALT_MAX} characters or fewer.`,
  altOneLine: "The alt text must stay on one line.",
  badFile: "Use a JPEG, PNG, WebP or AVIF image of 15 MB or less.",
  notFound: "The upload didn't arrive. Try again.",
  failed: "The change wasn't saved. Try again.",
} as const;
