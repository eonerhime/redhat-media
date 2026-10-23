// The grid, or an item's full page, with the @modal slot after it (Phase 22 spec, D1, D2). The slot
// lives here and not in the (public) layout, so only /portfolio opens items as a modal and no other
// page's render mode can change.
export default function PortfolioLayout({ children, modal }: LayoutProps<"/portfolio">) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
