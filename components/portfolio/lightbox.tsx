"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

export type LightboxImage = {
  id: string;
  /** Shown under the image: the caption, or the alt text when there is none. */
  text: string;
  /** A rendered <MediaImage fit="contain">; lazy, so it loads only when shown. */
  image: ReactNode;
};

export type LightboxLabels = {
  label: string;
  close: string;
  previous: string;
  next: string;
  /** "Image {n} of {total}" */
  position: string;
};

type Open = (index: number, opener: HTMLElement) => void;

const LightboxContext = createContext<Open | null>(null);

/**
 * The portfolio image viewer (Phase 12 spec, D6): a native modal <dialog>, so the page behind it
 * is inert, focus stays inside and Escape closes it, with no library. It shows one image at a
 * time, whole. <LightboxTrigger>s inside `children` open it at their index, and focus goes back
 * to the trigger on close.
 */
export function Lightbox({
  images,
  labels,
  children,
}: {
  images: readonly LightboxImage[];
  labels: LightboxLabels;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [index, setIndex] = useState(0);
  const total = images.length;
  const current = images[index];

  const open: Open = (at, from) => {
    opener.current = from;
    setIndex(at);
    dialog.current?.showModal();
  };

  const step = (by: number) => setIndex((at) => (at + by + total) % total);

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (total < 2) return;
    if (event.key === "ArrowLeft") step(-1);
    else if (event.key === "ArrowRight") step(1);
    else return;
    event.preventDefault();
  }

  // The dialog's content fills its box, so a click on the dialog element itself is on the backdrop.
  function onClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) dialog.current?.close();
  }

  const button =
    "rounded-full border border-line px-4 py-2 font-semibold transition-colors hover:border-fg";

  return (
    <LightboxContext value={open}>
      {children}
      <dialog
        ref={dialog}
        aria-label={labels.label}
        data-testid="lightbox"
        onKeyDown={onKeyDown}
        onClick={onClick}
        onClose={() => opener.current?.focus()}
        className="m-auto h-[calc(100dvh-2rem)] max-h-none w-[calc(100vw-2rem)] max-w-6xl rounded-xl border border-line bg-ink p-0 text-fg backdrop:bg-ink/90"
      >
        <div className="flex h-full flex-col gap-4 p-4">
          <div className="flex items-center justify-between gap-4">
            <p role="status" className="text-base">
              {total > 1
                ? labels.position
                    .replace("{n}", String(index + 1))
                    .replace("{total}", String(total))
                : null}
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => dialog.current?.close()}
              className={button}
            >
              {labels.close}
            </button>
          </div>
          <div className="relative min-h-0 flex-1">
            {images.map((item, at) => (
              <div
                key={item.id}
                hidden={at !== index}
                data-testid="lightbox-image"
                className="absolute inset-0"
              >
                {item.image}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4">
            {total > 1 ? (
              <button type="button" onClick={() => step(-1)} className={button}>
                <span aria-hidden="true">← </span>
                {labels.previous}
              </button>
            ) : (
              <span />
            )}
            <p className="text-center text-base">{current?.text}</p>
            {total > 1 ? (
              <button type="button" onClick={() => step(1)} className={button}>
                {labels.next}
                <span aria-hidden="true"> →</span>
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      </dialog>
    </LightboxContext>
  );
}

/** A button around an image that opens the lightbox at `index`. Without JavaScript it does nothing. */
export function LightboxTrigger({
  index,
  label,
  className,
  children,
}: {
  index: number;
  /** "View larger: {alt}" */
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const open = useContext(LightboxContext);
  return (
    <button
      type="button"
      aria-label={label}
      aria-haspopup="dialog"
      onClick={(event) => open?.(index, event.currentTarget)}
      className={["block w-full cursor-zoom-in", className].filter(Boolean).join(" ")}
    >
      {children}
    </button>
  );
}
