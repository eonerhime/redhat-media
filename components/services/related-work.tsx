import type { ServiceCategory } from "@/content/services";

// The service page's related-work slot (roadmap Phase 5). It renders nothing until Phase 10 fills
// it with published portfolio items in this category and adds its heading key (Phase 5 spec, D6).
export async function RelatedWork({ category }: { category: ServiceCategory }) {
  void category;
  return null;
}
