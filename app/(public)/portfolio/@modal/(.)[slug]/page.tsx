import type { Metadata } from "next";
import {
  PortfolioDetail,
  PortfolioDetailUnavailable,
} from "@/components/portfolio/portfolio-detail";
import { itemMetadata, itemStaticParams, readItem } from "@/lib/portfolio/item-route";

// /portfolio/[slug] opened from the grid, as a modal over it (Phase 22 spec, D1–D3). The same params,
// read and metadata as the full page (D7, D9). No JSON-LD: the full page at this URL carries it.
export async function generateStaticParams() {
  return itemStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return itemMetadata(params);
}

export default async function PortfolioItemModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await readItem(params);
  return item ? <PortfolioDetail item={item} modal /> : <PortfolioDetailUnavailable modal />;
}
