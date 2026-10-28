import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { paragraphs, stripBold, withBold } from "./rich-text";

// Bold-only rich text (Phase 27 spec, D3): React elements, never HTML from the value.

const html = (line: string, plain?: (text: string) => React.ReactNode) =>
  renderToStaticMarkup(createElement(Fragment, null, withBold(line, plain)));

describe("withBold()", () => {
  it("renders **x** as <strong>", () => {
    expect(html("We **build** and **ship**.")).toBe(
      "We <strong>build</strong> and <strong>ship</strong>.",
    );
  });

  it("leaves a line with no markers exactly as it was", () => {
    expect(html("Plain text.")).toBe("Plain text.");
  });

  it("keeps an unmatched marker as typed", () => {
    expect(html("Half **open")).toBe("Half **open");
    expect(html("**** empty")).toBe("**** empty");
  });

  it("escapes markup typed into a block", () => {
    expect(html('<script>alert(1)</script> **<img src=x onerror="y">**')).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt; <strong>&lt;img src=x onerror=&quot;y&quot;&gt;</strong>",
    );
  });

  it("passes each run through `plain`", () => {
    const upper = (text: string) => text.toUpperCase();
    expect(html("a **b** c", upper)).toBe("A <strong>B</strong> C");
  });
});

describe("paragraphs()", () => {
  it("splits on line breaks, trims and drops empty lines", () => {
    expect(paragraphs("One.\n\n  Two.  \n\nThree.")).toEqual(["One.", "Two.", "Three."]);
    expect(paragraphs("Only one.")).toEqual(["Only one."]);
  });
});

describe("stripBold()", () => {
  it("removes the markers", () => {
    expect(stripBold("We **build** it")).toBe("We build it");
    expect(stripBold("Half **open")).toBe("Half **open");
  });
});
