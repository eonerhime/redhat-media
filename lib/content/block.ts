// The only way pages read copy (Phase 2 spec, D2–D3): a staff edit when there is one, otherwise
// the default (Phase 27 spec, D6). Server-only from Phase 27, because it reads the database
// (Phase 2 spec, C4).

import "server-only";

import { readContentBlocks } from "./read";
import { resolveBlock, type BlockKey } from "./read-core";

export type { BlockKey } from "./read-core";

export async function block(key: BlockKey): Promise<string> {
  const result = await readContentBlocks();
  return resolveBlock(key, result.ok ? result.overrides : null);
}
