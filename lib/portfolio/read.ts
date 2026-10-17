import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "@/lib/db";
import {
  fetchPortfolioItem,
  fetchPublishedPortfolio,
  type PortfolioCard,
  type PortfolioDetail,
} from "./read-core";

/** Phase 31's portfolio mutations refresh this tag (tech-stack.md → Architectural rules 13). */
export const PORTFOLIO_TAG = "portfolio";

export type PortfolioResult = { ok: true; cards: PortfolioCard[] } | { ok: false };

/**
 * Every published portfolio card, the one read behind /portfolio and the
 * service pages' related work (Phase 10 spec, D2). It never throws: a throw
 * inside "use cache" fails the prerender even when the caller catches it. A
 * failure is cached for minutes, so the page shows its unavailable state and
 * tries again soon; a success is cached for hours.
 */
export async function getPublishedPortfolio(): Promise<PortfolioResult> {
  "use cache";
  cacheTag(PORTFOLIO_TAG);
  try {
    const cards = await fetchPublishedPortfolio(getDb());
    cacheLife("hours");
    return { ok: true, cards };
  } catch (error) {
    cacheLife("minutes");
    console.error(
      `[portfolio] read failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return { ok: false };
  }
}

export type PortfolioItemResult = { ok: true; item: PortfolioDetail | null } | { ok: false };

/**
 * One published item and its media, for /portfolio/[slug] (Phase 12 spec, D2). Same tag and
 * lifetimes as the list read, so Phase 31's refresh covers both, and it never throws either.
 * `item: null` means no published item has this slug.
 */
export async function getPortfolioItem(slug: string): Promise<PortfolioItemResult> {
  "use cache";
  cacheTag(PORTFOLIO_TAG);
  try {
    const item = await fetchPortfolioItem(getDb(), slug);
    cacheLife("hours");
    return { ok: true, item };
  } catch (error) {
    cacheLife("minutes");
    console.error(
      `[portfolio] item read failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return { ok: false };
  }
}
