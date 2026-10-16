import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { errorCopy } from "@/lib/site";
import { ErrorView } from "./error-view";

type Props = { children?: unknown; onClick?: () => void; href?: string };

/** Every element in the tree, depth first. ErrorView has no hooks, so it can be called directly. */
function elements(node: unknown): ReactElement<Props>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement<Props>;
  return [element, ...elements(element.props.children)];
}

const texts = (node: unknown) =>
  elements(node).flatMap((e) => (typeof e.props.children === "string" ? [e.props.children] : []));

// Phase 10 spec, D6; Phase 15 spec, D2.
describe("<ErrorView>", () => {
  it("shows the fixed error copy", () => {
    const tree = ErrorView({ onRetry: () => {} });
    expect(texts(tree)).toEqual(
      expect.arrayContaining([errorCopy.heading, errorCopy.body, errorCopy.retry]),
    );
  });

  it("calls onRetry from the retry button", () => {
    const onRetry = vi.fn();
    const button = elements(ErrorView({ onRetry })).find((e) => e.type === "button");
    button?.props.onClick?.();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("adds a plain link home only when asked", () => {
    const homeLink = (tree: unknown) =>
      elements(tree).find((e) => e.type === "a" && e.props.href === "/");
    expect(homeLink(ErrorView({ onRetry: () => {} }))).toBeUndefined();
    expect(homeLink(ErrorView({ onRetry: () => {}, home: true }))?.props.children).toBe(
      errorCopy.home,
    );
  });
});
