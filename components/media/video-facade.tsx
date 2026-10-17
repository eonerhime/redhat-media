"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

type VideoFacadeProps = {
  title: string;
  /** Opens the video on YouTube or Vimeo without JavaScript, or on a modifier click. */
  canonicalUrl: string;
  /** Loaded only after a click (videoEmbedUrl in lib/media/video-url.ts). */
  embedUrl: string;
  /** A rendered <MediaImage> poster; wins over posterUrl. */
  poster?: ReactNode;
  /** An i.ytimg.com or i.vimeocdn.com thumbnail. */
  posterUrl?: string | null;
};

/**
 * Click-to-play video (Phase 8 spec, D9): a link with a poster until the visitor
 * presses play, then the player <iframe>. Nothing third-party loads before that.
 * Render it through <VideoEmbed>, which resolves the poster.
 */
export function VideoFacade({
  title,
  canonicalUrl,
  embedUrl,
  poster,
  posterUrl,
}: VideoFacadeProps) {
  const [playing, setPlaying] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (playing) frame.current?.focus();
  }, [playing]);

  // Enter on a focused link also fires click, with button 0.
  function play(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return; // let the browser open a new tab or window
    }
    event.preventDefault();
    setPlaying(true);
  }

  return (
    <div className="relative aspect-video w-full bg-ink">
      {playing ? (
        <iframe
          ref={frame}
          src={embedUrl}
          title={title}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <a
          href={canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={play}
          aria-label={`Play video: ${title}`}
          className="group absolute inset-0 block"
        >
          <span className="absolute inset-0 overflow-hidden">
            {poster ??
              (posterUrl ? (
                // Third-party thumbnail: Cloudinary refuses fetched URLs (D2) and Vercel's
                // optimiser should not proxy it, so a plain lazy <img> (D9).
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={posterUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-line font-display text-2xl font-bold tracking-wide text-muted">
                  RED<span className="text-brand">HAT</span>
                </span>
              ))}
          </span>
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-deep text-fg shadow-lg transition-transform motion-safe:group-hover:scale-110"
          >
            <svg viewBox="0 0 24 24" className="ml-1 size-7" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </a>
      )}
    </div>
  );
}
