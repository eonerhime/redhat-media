// A soft navigation keeps a slot's last page when the new URL has no match in it, so /portfolio
// matches this empty page and a link back to the grid closes the modal (Phase 22 spec, D1).
export default function NoModal() {
  return null;
}
