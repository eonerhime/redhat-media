"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { attachMedia, removeMedia, signCloudinaryUpload } from "@/lib/media/actions";
import type { MediaSlot, SlotImage } from "@/lib/media/slots";
import {
  ALT_MAX,
  MAX_UPLOAD_BYTES,
  mediaErrors,
  UPLOAD_MIME_TYPES,
} from "@/lib/media/upload-rules";
import { cmsCopy } from "./cms-copy";
import { PencilIcon } from "./edit-button";
import { useEditMode } from "./edit-mode";

// The ✎ on a slot's image and its dialog (Phase 28 spec, D3, D5), after MRU's profile pill and
// media-upload.tsx. For visitors and with editing off it renders the image alone, so the page's
// HTML is the visitor's. The file goes from the browser straight to Cloudinary with a signature
// from signCloudinaryUpload, never through a Vercel function; attachMedia then checks and saves it.

const copy = cmsCopy.imageEditor;
const PREVIEW = 40;

function preview(alt: string) {
  const text = alt.replace(/\s+/g, " ").trim();
  return text.length > PREVIEW ? `${text.slice(0, PREVIEW).trimEnd()}…` : text;
}

function fileSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** The browser's own check, before any request (D5); the server checks Cloudinary's record. */
export function checkFile(file: { type: string; size: number }): string | null {
  const typeOk = (UPLOAD_MIME_TYPES as readonly string[]).includes(file.type);
  return typeOk && file.size <= MAX_UPLOAD_BYTES ? null : mediaErrors.badFile;
}

/** The same alt rules as attachMedia (D9), so the dialog refuses before any request. */
export function checkAlt(alt: string): string | null {
  const text = alt.trim();
  if (text === "") return mediaErrors.altRequired;
  if (text.length > ALT_MAX) return mediaErrors.altTooLong;
  return null;
}

export function ImageEditor({
  slot,
  image,
  hasUpload,
  children,
}: {
  slot: MediaSlot;
  image: SlotImage;
  /** The slot holds a staff upload, not its default: Remove is offered (D3). */
  hasUpload: boolean;
  /** The server-rendered <MediaImage>. */
  children: ReactNode;
}) {
  const { editMode, openKey, setOpenKey } = useEditMode();
  const instance = `${slot}#${useId()}`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Each opening mounts a fresh dialog, as the text editor does (Phase 27).
  const [opening, setOpening] = useState(0);

  if (!editMode) return children;

  return (
    // Inside the image's own box, so turning editing on moves nothing (Phase 27, D9 amended).
    <div className="relative">
      {children}
      <button
        ref={buttonRef}
        type="button"
        aria-label={copy.edit(preview(image.alt))}
        aria-haspopup="dialog"
        onClick={() => {
          setOpening((n) => n + 1);
          setOpenKey(instance);
        }}
        className="absolute top-2 right-2 z-10 inline-flex size-6 items-center justify-center rounded-full border border-fg bg-ink text-fg hover:border-brand print:hidden"
      >
        <PencilIcon />
      </button>
      {openKey === instance && (
        <ImageDialog
          key={opening}
          slot={slot}
          image={image}
          hasUpload={hasUpload}
          current={children}
          onClose={() => {
            setOpenKey(null);
            buttonRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}

function ImageDialog({
  slot,
  image,
  hasUpload,
  current,
  onClose,
}: {
  slot: MediaSlot;
  image: SlotImage;
  hasUpload: boolean;
  current: ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState(image.alt);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"idle" | "uploading" | "saving" | "removing">("idle");
  const [, startTransition] = useTransition();
  const router = useRouter();
  const ids = useId();
  const busy = step !== "idle";

  // Modal from the start: focus moves in, the page behind is inert, and Escape closes it.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    fileRef.current?.focus();
    return () => dialog?.close();
  }, []);

  function choose(chosen: File | null) {
    setError("");
    if (chosen) {
      const refusal = checkFile(chosen);
      if (refusal) {
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
        return setError(refusal);
      }
    }
    setFile(chosen);
  }

  /** Runs one step; a refusal keeps the dialog open with the draft (Architectural rules 8). */
  function run(work: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError("");
    startTransition(async () => {
      try {
        const result = await work();
        if (!result.ok) return setError(result.error);
        onClose();
        router.refresh();
      } catch {
        setError(cmsCopy.unavailable);
      } finally {
        setStep("idle");
      }
    });
  }

  function save() {
    const refusal = checkAlt(alt) ?? (file ? checkFile(file) : null);
    if (refusal) return setError(refusal);
    run(async () => {
      if (!file) {
        setStep("saving");
        return attachMedia(slot, image.publicId, alt);
      }
      setStep("uploading");
      const signed = await signCloudinaryUpload(slot);
      if (!signed.ok) return signed;
      const { upload } = signed;
      const body = new FormData();
      body.append("file", file);
      body.append("api_key", upload.apiKey);
      body.append("timestamp", String(upload.timestamp));
      body.append("signature", upload.signature);
      body.append("public_id", upload.publicId);
      body.append("asset_folder", upload.assetFolder);
      body.append("allowed_formats", upload.allowedFormats);
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(upload.cloudName)}/image/upload`,
        { method: "POST", body },
      ).catch(() => null);
      if (!response?.ok) return { ok: false, error: copy.uploadFailed };
      setStep("saving");
      return attachMedia(slot, upload.publicId, alt);
    });
  }

  function remove() {
    setStep("removing");
    run(() => removeMedia(slot));
  }

  const length = alt.trim().length;
  const fieldClass =
    "mt-2 w-full rounded-md border border-muted bg-ink px-3 py-2 text-base text-fg focus-visible:border-fg";

  // On <body>, like the text editor's dialog.
  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={`${ids}-title`}
      onClose={onClose}
      className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-xl border border-line bg-ink p-6 text-left font-sans text-base font-normal text-fg backdrop:bg-ink/80"
    >
      <form
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy) save();
        }}
      >
        <h2 id={`${ids}-title`} className="font-display text-2xl font-extrabold">
          {copy.title}
        </h2>
        <figure className="mt-4">
          <div className="w-32 overflow-hidden rounded-md border border-line">{current}</div>
          <figcaption className="mt-1 text-sm text-muted">{copy.current}</figcaption>
        </figure>
        <label htmlFor={`${ids}-file`} className="mt-4 block font-semibold">
          {copy.file}
        </label>
        <input
          ref={fileRef}
          id={`${ids}-file`}
          type="file"
          accept={UPLOAD_MIME_TYPES.join(",")}
          onChange={(event) => choose(event.target.files?.[0] ?? null)}
          aria-describedby={`${ids}-file-hint ${ids}-chosen`}
          className="mt-2 block w-full text-sm file:mr-3 file:rounded-full file:border file:border-muted file:bg-ink file:px-4 file:py-1 file:font-semibold file:text-fg hover:file:border-fg"
        />
        <p id={`${ids}-file-hint`} className="mt-1 text-sm text-muted">
          {copy.fileHint}
        </p>
        <p id={`${ids}-chosen`} className="mt-1 text-sm" aria-live="polite">
          {file ? copy.chosen(file.name, fileSize(file.size)) : ""}
        </p>
        <label htmlFor={`${ids}-alt`} className="mt-4 block font-semibold">
          {copy.alt}
        </label>
        <input
          id={`${ids}-alt`}
          value={alt}
          // Not `required`: the browser's own bubble would replace the dialog's error (rule 8).
          aria-required="true"
          onChange={(event) => setAlt(event.target.value.replace(/\s*[\r\n]+\s*/g, " "))}
          aria-describedby={`${ids}-count ${ids}-alt-hint`}
          aria-invalid={error !== "" || undefined}
          className={fieldClass}
        />
        <p
          id={`${ids}-count`}
          className={`mt-2 text-sm ${length > ALT_MAX ? "text-fg" : "text-muted"}`}
        >
          {copy.count(length, ALT_MAX)}
        </p>
        <p id={`${ids}-alt-hint`} className="mt-1 text-sm text-muted">
          {copy.altHint}
        </p>
        {error && (
          <p role="alert" className="mt-4 rounded-md border border-brand px-3 py-2">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          {hasUpload && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="mr-auto rounded-full border border-muted px-5 py-2 font-semibold hover:border-fg disabled:opacity-70"
            >
              {step === "removing" ? copy.removing : copy.remove}
            </button>
          )}
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-full border border-muted px-5 py-2 font-semibold hover:border-fg"
          >
            {copy.cancel}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-brand-deep px-5 py-2 font-semibold text-fg disabled:opacity-70"
          >
            {step === "uploading" ? copy.uploading : step === "saving" ? copy.saving : copy.save}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}
