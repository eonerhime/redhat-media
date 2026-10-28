"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { updateContentBlock } from "@/lib/content/actions";
import { BLOCK_KINDS, editableKind, type BlockKind } from "@/lib/content/editable";
import { stripBold } from "@/lib/content/rich-text";
import { cmsCopy } from "./cms-copy";
import { useEditMode } from "./edit-mode";

// The ✎ beside a copy block and its editor dialog (Phase 27 spec, D2, D9), after MRU's
// editable.tsx. It renders nothing for visitors, with editing off, or for a key that isn't
// editable, so the page's HTML is the visitor's. The text itself is rendered on the server; after
// a save the action's updateTag() and router.refresh() bring the new text in.

const copy = cmsCopy.editor;
const PREVIEW = 40;

/** The start of the text, for the button's label, so each ✎ on a page is distinct. */
function preview(value: string) {
  const text = stripBold(value).replace(/\s+/g, " ").trim();
  return text.length > PREVIEW ? `${text.slice(0, PREVIEW).trimEnd()}…` : text;
}

/** Gaps in px: after the text, and from the window's right edge. */
const GAP = 6;
const EDGE = 4;

/** The last line box of what the ✎ follows: its text, or the control before it. */
function lastLine(button: HTMLElement) {
  let node = button.previousSibling;
  while (node?.nodeType === Node.TEXT_NODE && !node.textContent?.trim())
    node = node.previousSibling;
  if (!node) return null;
  let rects: DOMRectList;
  if (node instanceof Element) rects = node.getClientRects();
  else {
    const range = document.createRange();
    range.selectNodeContents(node);
    rects = range.getClientRects();
  }
  return rects.length ? rects[rects.length - 1] : null;
}

/**
 * The ✎ is out of the flow, so turning editing on moves nothing (D9 amended). It is moved to
 * just after the last line of what it follows, centred on it, and kept inside the window. Its
 * own place in the flow can't be used: in a flex row it is the row's start. `corner` puts it on
 * the top-right corner of an <EditAround> instead, where the next control is too close.
 */
export function EditButton({
  blockKey,
  value,
  corner = false,
}: {
  blockKey: string;
  value: string;
  corner?: boolean;
}) {
  const { editMode, openKey, setOpenKey } = useEditMode();
  // One block can appear twice on a page (a CTA label), so each ✎ has its own key.
  const instance = `${blockKey}#${useId()}`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Each opening mounts a fresh dialog. Escape closes the native <dialog> before React unmounts
  // it, so a quick reopen could be batched with the close and leave the closed one in place.
  const [opening, setOpening] = useState(0);
  const kind = editableKind(blockKey);

  useLayoutEffect(() => {
    const button = buttonRef.current;
    if (!button || corner) return;
    function fit() {
      if (!button) return;
      button.style.translate = "";
      const line = lastLine(button);
      if (!line) return;
      const box = button.getBoundingClientRect();
      // After a line that ends at the window's edge, back over the text, so the page doesn't
      // scroll sideways.
      const left = Math.min(
        line.right + GAP,
        document.documentElement.clientWidth - EDGE - box.width,
      );
      const top = line.top + (line.height - box.height) / 2;
      button.style.translate = `${Math.round(left - box.left)}px ${Math.round(top - box.top)}px`;
    }
    fit();
    // The text can rewrap without a window resize (a font loading, a sibling changing).
    const observer = new ResizeObserver(fit);
    if (button.parentElement) observer.observe(button.parentElement);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [editMode, corner, value]);

  if (!editMode || !kind) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={copy.edit(preview(value))}
        aria-haspopup="dialog"
        onClick={() => {
          setOpening((n) => n + 1);
          setOpenKey(instance);
        }}
        // Inside headings and over a card's covering link: its own size, case and stacking.
        className={`absolute z-10 inline-flex items-center justify-center rounded-full border border-fg bg-ink font-sans text-sm leading-none font-normal tracking-normal text-fg normal-case not-italic hover:border-brand print:hidden ${corner ? "top-0 -right-1 size-6" : "size-7"}`}
      >
        {/* An SVG, not the ✎ character, which some systems draw as a colour emoji. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
      {openKey === instance && (
        <EditorDialog
          key={opening}
          blockKey={blockKey}
          kind={kind}
          value={value}
          onClose={() => {
            setOpenKey(null);
            buttonRef.current?.focus();
          }}
        />
      )}
    </>
  );
}

/**
 * A control that a flex column stretches, or a chip too close to the next one, with its ✎. With
 * editing on, a wrapper the control's size holds both, aligned by `className` as the control
 * was, so the ✎ follows the control and not the column's edge. Otherwise the control alone, so a
 * visitor's HTML doesn't change.
 */
export function EditAround({
  blockKey,
  value,
  corner = false,
  className = "",
  children,
}: {
  blockKey: string;
  value: string;
  corner?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const { editMode } = useEditMode();
  if (!editMode || !editableKind(blockKey)) return children;
  return (
    <span className={`relative flex ${className}`}>
      {children}
      <EditButton blockKey={blockKey} value={value} corner={corner} />
    </span>
  );
}

function EditorDialog({
  blockKey,
  kind,
  value,
  onClose,
}: {
  blockKey: string;
  kind: BlockKind;
  value: string;
  onClose: () => void;
}) {
  const { max, multiline } = BLOCK_KINDS[kind];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fieldRef = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();
  const router = useRouter();
  const ids = useId();

  // Modal from the start: focus moves in, the page behind is inert, and Escape closes it.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    // Into the text, not the Bold button that comes first in a body block's dialog.
    fieldRef.current?.focus();
    return () => dialog?.close();
  }, []);

  function save() {
    setError("");
    startSaving(async () => {
      try {
        const result = await updateContentBlock(blockKey, draft);
        // A refusal keeps the dialog open with the draft (tech-stack.md → Architectural rules 8).
        if (!result.ok) return setError(result.error);
        onClose();
        router.refresh();
      } catch {
        setError(cmsCopy.unavailable);
      }
    });
  }

  // Wraps the selection in ** (MRU), keeping the cursor and the scroll position.
  function bold() {
    const field = fieldRef.current;
    if (!field) return;
    const { selectionStart: start, selectionEnd: end, scrollTop } = field;
    const selected = draft.slice(start, end) || "bold text";
    setDraft(`${draft.slice(0, start)}**${selected}**${draft.slice(end)}`);
    const cursor = start + selected.length + 4;
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(cursor, cursor);
      field.scrollTop = scrollTop;
    });
  }

  const length = draft.replaceAll("\r", "").trim().length;
  const fieldClass =
    "mt-2 w-full rounded-md border border-muted bg-ink px-3 py-2 text-base text-fg focus-visible:border-fg";

  // On <body>: the ✎ sits inside headings and paragraphs, which can't hold a dialog.
  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={`${ids}-title`}
      onClose={onClose}
      className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-xl border border-line bg-ink p-6 text-left font-sans text-base font-normal tracking-normal text-fg normal-case not-italic backdrop:bg-ink/80"
    >
      <form
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          if (!saving) save();
        }}
      >
        <h2 id={`${ids}-title`} className="font-display text-2xl font-extrabold">
          {copy.title}
        </h2>
        <label htmlFor={`${ids}-field`} className="mt-4 block font-semibold">
          {copy.field}
        </label>
        {kind === "body" && (
          <button
            type="button"
            onClick={bold}
            title={copy.boldHint}
            className="mt-2 rounded-md border border-muted px-3 py-1 font-bold hover:border-fg"
          >
            {copy.bold}
          </button>
        )}
        {kind !== "label" ? (
          // Headings and lines wrap here too, so the whole text is in view (owner, 2026-10-28),
          // but stay one line: Enter saves, and a pasted line break becomes a space (D2 amended).
          <textarea
            ref={fieldRef}
            id={`${ids}-field`}
            value={draft}
            rows={multiline ? 8 : 3}
            onChange={(event) =>
              setDraft(
                multiline ? event.target.value : event.target.value.replace(/\s*[\r\n]+\s*/g, " "),
              )
            }
            onKeyDown={(event) => {
              if (multiline || event.key !== "Enter" || event.nativeEvent.isComposing) return;
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }}
            aria-describedby={`${ids}-count ${ids}-hint`}
            aria-invalid={error !== "" || undefined}
            className={`${fieldClass} resize-y`}
          />
        ) : (
          <input
            ref={fieldRef}
            id={`${ids}-field`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-describedby={`${ids}-count ${ids}-hint`}
            aria-invalid={error !== "" || undefined}
            className={fieldClass}
          />
        )}
        <p
          id={`${ids}-count`}
          className={`mt-2 text-sm ${length > max ? "text-fg" : "text-muted"}`}
        >
          {copy.count(length, max)}
        </p>
        <p id={`${ids}-hint`} className="mt-1 text-sm text-muted">
          {copy.resetHint}
        </p>
        {error && (
          <p role="alert" className="mt-4 rounded-md border border-brand px-3 py-2">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-full border border-muted px-5 py-2 font-semibold hover:border-fg"
          >
            {copy.cancel}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-deep px-5 py-2 font-semibold text-fg disabled:opacity-70"
          >
            {saving ? copy.saving : copy.save}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}
