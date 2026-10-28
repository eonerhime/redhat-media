import { Fragment, type ReactNode } from "react";

// Bold-only rich text for body blocks (Phase 27 spec, D3; MRU's rich-text). The stored value is
// plain text with **bold** markers. It renders through React elements, so markup typed into a
// block shows as text and no HTML is ever produced from it.

const BOLD = /\*\*(.+?)\*\*/;

/** The non-empty lines of a body block, trimmed: one paragraph each. */
export function paragraphs(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * One line with each **x** as <strong>x</strong>. An unmatched marker stays as typed. `plain`
 * renders each run of text, e.g. to turn an email address into a link.
 */
export function withBold(line: string, plain: (text: string) => ReactNode = (text) => text) {
  // split() with a capture group puts the bold runs at the odd indexes.
  return line
    .split(BOLD)
    .map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i}>{plain(part)}</strong>
      ) : (
        <Fragment key={i}>{plain(part)}</Fragment>
      ),
    );
}

/** The text with its ** markers removed, e.g. for a label. */
export function stripBold(text: string): string {
  return text.replace(new RegExp(BOLD.source, "g"), "$1");
}
