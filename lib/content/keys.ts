// The CMS block-key scheme (tech-stack.md → In-place CMS 4; Phase 2 spec, D4). Phase 27's
// updateContentBlock validates keys with this same constant, so a default always stays editable.

export const BLOCK_KEY_PREFIXES = [
  "home",
  "about",
  "services",
  "portfolio",
  "contact",
  "footer",
  // The privacy notice (Phase 18 spec, D12).
  "privacy",
] as const;

export type BlockKeyPrefix = (typeof BLOCK_KEY_PREFIXES)[number];

export const BLOCK_KEY_PATTERN = new RegExp(`^(${BLOCK_KEY_PREFIXES.join("|")})\\.[a-zA-Z0-9.]+$`);

// The type-level half of the pattern: a known prefix, a dot, then the rest. The character set
// after the prefix cannot be expressed as a type, so a test runs every key through the RegExp.
export type BlockKeyShape = `${BlockKeyPrefix}.${string}`;
