// Bounded fetches to fixed endpoints (Phase 8 spec, D5, D8). Callers build the
// URL from fixed parts and a checked ID; this module only limits time and size.

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

export const FETCH_TIMEOUT_MS = 5000;

/**
 * GETs `url` with a timeout, no redirects, and a body cap. Resolves to the
 * response and its body, or to an error message. Never throws.
 */
export async function fetchCapped(
  fetchFn: FetchFn,
  url: string,
  maxBytes: number,
): Promise<{ ok: true; response: Response; body: Uint8Array } | { ok: false; error: string }> {
  let response: Response;
  try {
    response = await fetchFn(url, {
      redirect: "error",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    return { ok: false, error: `fetch failed: ${(error as Error).name}` };
  }
  if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };

  const declared = Number(response.headers.get("content-length"));
  if (declared > maxBytes) return { ok: false, error: `body over ${maxBytes} bytes` };
  if (!response.body) return { ok: false, error: "empty body" };

  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = response.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { ok: false, error: `body over ${maxBytes} bytes` };
      }
      chunks.push(value);
    }
  } catch (error) {
    return { ok: false, error: `read failed: ${(error as Error).name}` };
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, response, body };
}
