// The `?service=` pre-fill (Phase 21 spec, D1, D8). The first `service` value must match a slug
// exactly, among the services the form was given, which are the visible ones. Anything else
// (unknown, muted, wrong case, empty) ticks nothing.
export function prefillCategory<C extends string>(
  search: string,
  options: readonly { slug: string; category: C }[],
): C | undefined {
  const slug = new URLSearchParams(search).get("service");
  return slug ? options.find((option) => option.slug === slug)?.category : undefined;
}
