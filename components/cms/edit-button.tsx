"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
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

export function EditButton({ blockKey, value }: { blockKey: string; value: string }) {
  const { editMode, openKey, setOpenKey } = useEditMode();
  // One block can appear twice on a page (a CTA label), so each ✎ has its own key.
  const instance = `${blockKey}#${useId()}`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const kind = editableKind(blockKey);
  if (!editMode || !kind) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={copy.edit(preview(value))}
        aria-haspopup="dialog"
        onClick={() => setOpenKey(instance)}
        // Inside headings and over a card's covering link: its own size, case and stacking.
        className="relative z-10 ml-2 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-fg bg-ink align-middle font-sans text-sm leading-none font-normal tracking-normal text-fg normal-case not-italic hover:border-brand print:hidden"
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
        {multiline ? (
          <textarea
            ref={fieldRef}
            id={`${ids}-field`}
            value={draft}
            rows={8}
            onChange={(event) => setDraft(event.target.value)}
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
