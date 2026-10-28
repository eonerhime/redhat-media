import type { ElementType, ReactNode } from "react";
import type { BlockKey } from "@/lib/content/block";
import { paragraphs, withBold } from "@/lib/content/rich-text";
import { EditButton } from "./edit-button";

// Editable copy (Phase 27 spec, D2, D3, D9; tech-stack.md → In-place CMS 4). The text renders on
// the server, exactly as before, and the client <EditButton> adds a ✎ after it only for an editor
// with editing on, so a visitor's HTML doesn't change. A link's or button's own label can't hold
// a button, so there the call site renders <EditButton> beside the control instead.

/** A heading, label or line, placed where the text was: `<h2><Editable … /></h2>`. */
export function Editable({ blockKey, value }: { blockKey: BlockKey; value: string }) {
  return (
    <>
      {value}
      <EditButton blockKey={blockKey} value={value} />
    </>
  );
}

/**
 * A body block: one element per paragraph, with **bold** (D3), and the ✎ after the last one.
 * `plain` renders each run of text, e.g. to turn an email address into a link.
 */
export function BodyText({
  blockKey,
  value,
  as: Tag = "p",
  className,
  plain,
}: {
  blockKey: BlockKey;
  value: string;
  as?: ElementType;
  className?: string;
  plain?: (text: string) => ReactNode;
}) {
  const lines = paragraphs(value);
  return lines.map((line, i) => (
    <Tag key={i} className={className}>
      {withBold(line, plain)}
      {i === lines.length - 1 && <EditButton blockKey={blockKey} value={value} />}
    </Tag>
  ));
}
