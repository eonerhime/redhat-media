// Shared inline styles for the inquiry emails (Phase 20 spec, D7): dark text on white, system
// fonts, one column, no images or remote assets. Mail clients ignore most <style> blocks.

import type { CSSProperties } from "react";

const ink = "#1a1a1a";
const muted = "#5f6164";
// The brand's darker red (--color-brand-deep), which passes contrast on white for links.
const brandDeep = "#d0181f";

export const body: CSSProperties = {
  backgroundColor: "#ffffff",
  color: ink,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: "24px 0",
};

export const container: CSSProperties = { maxWidth: "560px", margin: "0 auto", padding: "0 16px" };

export const heading: CSSProperties = { fontSize: "22px", lineHeight: "28px", margin: "0 0 16px" };

export const subheading: CSSProperties = {
  fontSize: "16px",
  lineHeight: "22px",
  margin: "24px 0 8px",
};

export const text: CSSProperties = { fontSize: "15px", lineHeight: "22px", margin: "0 0 8px" };

export const notes: CSSProperties = { ...text, whiteSpace: "pre-wrap" };

export const list: CSSProperties = { margin: "0 0 8px", paddingLeft: "20px" };

export const listItem: CSSProperties = { fontSize: "15px", lineHeight: "22px" };

export const link: CSSProperties = { color: brandDeep, textDecoration: "underline" };

export const footer: CSSProperties = {
  fontSize: "13px",
  lineHeight: "19px",
  color: muted,
  margin: "0 0 8px",
};

export const rule: CSSProperties = { borderColor: "#e3e3e3", margin: "24px 0" };
