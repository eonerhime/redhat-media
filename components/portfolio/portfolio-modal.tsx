"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { MODAL_LABEL_ID } from "./modal-label";

/**
 * The portfolio item as a modal over the grid (Phase 22 spec, D4–D6): a native modal <dialog>, so
 * the grid is inert, focus stays inside and Escape is handled, with no library. Every way of
 * closing it is the browser's Back, so the URL and the screen never disagree. When Back removes
 * it, focus goes back to the card link that opened it.
 */
export function PortfolioModal({
  closeLabel,
  children,
}: {
  closeLabel: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const leaving = useRef(false);

  // A layout effect, so the dialog is open (and in the viewport) before the router decides whether
  // the new segment needs scrolling into view: the grid behind keeps its scroll position.
  //
  // The router keeps a route it left in a hidden <Activity> instead of unmounting it, and runs
  // this cleanup then. A hidden dialog that is still :modal would leave the next page inert and
  // unscrollable, so the cleanup closes it (without going Back again) and returns focus to the
  // card link. Forward reveals it again and this effect reopens it.
  useLayoutEffect(() => {
    if (!opener.current && document.activeElement instanceof HTMLElement) {
      opener.current = document.activeElement;
    }
    leaving.current = false;
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    // Focus Close by hand: React's autoFocus runs before the dialog is open, and the browser's own
    // pick can be the scroll box, which is focusable as a scroller.
    close.current?.focus();
    return () => {
      leaving.current = true;
      if (element?.open) element.close();
      opener.current?.focus({ preventScroll: true });
    };
  }, []);

  function back() {
    if (leaving.current) return;
    leaving.current = true;
    router.back();
  }

  // The scroll box fills the dialog, so a click on the dialog element itself is on the backdrop
  // (from 768px; below that there is no backdrop to click).
  function onClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) back();
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={MODAL_LABEL_ID}
      data-testid="portfolio-modal"
      // React passes every dialog's cancel and close events up the component tree, so the nested
      // lightbox's arrive here too. Only this dialog's own count: Escape in the lightbox closes
      // only the lightbox.
      //
      // Escape: keep the dialog open and go Back, which removes it.
      onCancel={(event) => {
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        back();
      }}
      // The browser can close a modal without a cancel event (a repeated Escape); go Back then too.
      // The close event is queued, so one from the effect's own cleanup can arrive after the dialog
      // has reopened (StrictMode's second mount); that one is ignored.
      onClose={(event) => {
        if (event.target === event.currentTarget && !dialog.current?.open) back();
      }}
      onClick={onClick}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-ink p-0 text-fg backdrop:bg-ink/90 motion-safe:transition-[opacity,translate] motion-safe:duration-200 motion-safe:starting:open:translate-y-4 motion-safe:starting:open:opacity-0 md:m-auto md:h-[calc(100dvh-2rem)] md:w-[calc(100vw-2rem)] md:max-w-6xl md:rounded-xl md:border md:border-line"
    >
      <div className="h-full overflow-y-auto overscroll-contain">
        <div className="sticky top-0 z-10 flex justify-end border-b border-line bg-ink px-4 py-3">
          <button
            ref={close}
            type="button"
            onClick={back}
            className="rounded-full border border-line px-4 py-2 font-semibold transition-colors hover:border-fg"
          >
            {closeLabel}
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
