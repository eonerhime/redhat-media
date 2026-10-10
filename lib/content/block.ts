// The only way pages read copy (Phase 2 spec, D2–D3). Async now so Phase 27 can put a cached
// ContentBlock read behind it without touching a call site. It gains `import "server-only"`
// at that point (C4).

import { defaults } from "../../content/defaults";

export type BlockKey = keyof typeof defaults;

export async function block(key: BlockKey): Promise<string> {
  // A key widened through a cast, or one arriving from the database or a URL later on.
  if (!Object.hasOwn(defaults, key)) throw new Error(`Unknown content block key: ${String(key)}`);
  return defaults[key];
}
