import ts from "typescript";
import type { PublicMutation } from "./public-mutations";

// The unguarded-mutation check (Phase 25 spec, D11; tech-stack.md →
// Authorization & application). A real parse with the TypeScript compiler API,
// not a regex, so a requireRole() call elsewhere in a file cannot satisfy it.
// It checks:
//   - every export of a module with a "use server" directive;
//   - every function with an inline "use server" directive;
//   - the POST, PUT, PATCH and DELETE exports of app/**/route.ts.
// Each must open with `await requireRole(...)`, bare or assigned to a variable.
// "First statement" keeps the rule simple to audit. Whatever it cannot see
// through (a re-export, a wrapped handler) fails too. This module is a pure
// function over source text; guard-coverage.test.ts runs it over app/, lib/
// and components/.

export const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"] as const;

const GUARD = "requireRole";

export type Violation = { file: string; name: string; line: number; problem: string };

export function isRouteFile(file: string): boolean {
  return /^app\/(.+\/)?route\.(ts|tsx|js|mjs)$/.test(file);
}

type FunctionLike =
  ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration;

function isFunctionLike(node: ts.Node): node is FunctionLike {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node)
  );
}

function directives(statements: ts.NodeArray<ts.Statement>): {
  names: string[];
  rest: ts.Statement[];
} {
  const names: string[] = [];
  let index = 0;
  for (; index < statements.length; index++) {
    const statement = statements[index]!;
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) break;
    names.push(statement.expression.text);
  }
  return { names, rest: statements.slice(index) };
}

function isGuardCall(expression: ts.Expression | undefined): boolean {
  if (!expression || !ts.isAwaitExpression(expression)) return false;
  const call = expression.expression;
  return (
    ts.isCallExpression(call) && ts.isIdentifier(call.expression) && call.expression.text === GUARD
  );
}

/** Why the function is not guarded, or null when its first statement awaits requireRole(). */
function guardProblem(fn: FunctionLike): string | null {
  if (!fn.body) return "has no body";
  if (!ts.isBlock(fn.body))
    return `is an expression-bodied arrow; open a block with await ${GUARD}(...)`;
  const [first] = directives(fn.body.statements).rest;
  if (!first) return `is empty; it must open with await ${GUARD}(...)`;
  if (ts.isExpressionStatement(first) && isGuardCall(first.expression)) return null;
  if (ts.isVariableStatement(first)) {
    const [declaration, ...others] = first.declarationList.declarations;
    if (declaration && others.length === 0 && isGuardCall(declaration.initializer)) return null;
  }
  return `does not open with await ${GUARD}(...)`;
}

function lineOf(source: ts.SourceFile, node: ts.Node): number {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
}

/** The local functions a module declares at top level, by name. */
function localFunctions(source: ts.SourceFile): Map<string, FunctionLike | null> {
  const found = new Map<string, FunctionLike | null>();
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name)
      found.set(statement.name.text, statement);
    else if (ts.isVariableStatement(statement))
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        const init = declaration.initializer;
        found.set(declaration.name.text, init && isFunctionLike(init) ? init : null);
      }
  }
  return found;
}

const hasExport = (node: ts.Node) =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

const hasDefault = (node: ts.Node) =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);

type Exported = { name: string; fn: FunctionLike | null; node: ts.Node; note?: string };

/** Every export of the module, resolved to its function where the parse can see it. */
function exportsOf(source: ts.SourceFile): Exported[] {
  const locals = localFunctions(source);
  const out: Exported[] = [];
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && hasExport(statement)) {
      const name = hasDefault(statement) ? "default" : (statement.name?.text ?? "default");
      out.push({ name, fn: statement, node: statement });
    } else if (ts.isVariableStatement(statement) && hasExport(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const name = ts.isIdentifier(declaration.name) ? declaration.name.text : "<pattern>";
        const init = declaration.initializer;
        out.push({ name, fn: init && isFunctionLike(init) ? init : null, node: declaration });
      }
    } else if (ts.isExportAssignment(statement)) {
      const expression = statement.expression;
      const fn = isFunctionLike(expression)
        ? expression
        : ts.isIdentifier(expression)
          ? (locals.get(expression.text) ?? null)
          : null;
      out.push({ name: "default", fn, node: statement });
    } else if (ts.isExportDeclaration(statement) && !statement.isTypeOnly) {
      const clause = statement.exportClause;
      if (statement.moduleSpecifier || !clause || !ts.isNamedExports(clause)) {
        out.push({ name: "*", fn: null, node: statement, note: "re-exports from another module" });
        continue;
      }
      for (const element of clause.elements) {
        if (element.isTypeOnly) continue;
        const local = (element.propertyName ?? element.name).text;
        out.push({ name: element.name.text, fn: locals.get(local) ?? null, node: element });
      }
    }
  }
  return out;
}

/** Functions anywhere in the module that open with an inline "use server" directive. */
function inlineServerFunctions(source: ts.SourceFile): FunctionLike[] {
  const found: FunctionLike[] = [];
  const visit = (node: ts.Node) => {
    if (isFunctionLike(node) && node.body && ts.isBlock(node.body))
      if (directives(node.body.statements).names.includes("use server")) found.push(node);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

function functionName(fn: FunctionLike, source: ts.SourceFile): string {
  if ((ts.isFunctionDeclaration(fn) || ts.isMethodDeclaration(fn)) && fn.name)
    return fn.name.getText(source);
  const parent = fn.parent;
  if (parent && ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name))
    return parent.name.text;
  return `<inline function, line ${lineOf(source, fn)}>`;
}

/**
 * The unguarded server actions and mutating route handlers in one file.
 * `file` is repo-relative with forward slashes; `allowlist` names the public ones.
 */
export function findUnguarded(
  file: string,
  text: string,
  allowlist: readonly PublicMutation[] = [],
): Violation[] {
  const kind = /\.(tsx|jsx)$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  const allowed = (name: string) =>
    allowlist.some((entry) => entry.file === file && entry.name === name);
  const violations: Violation[] = [];
  const report = (name: string, node: ts.Node, problem: string) => {
    if (!allowed(name)) violations.push({ file, name, line: lineOf(source, node), problem });
  };
  const checked = new Set<ts.Node>();
  const check = (entry: Exported, kind: string) => {
    if (!entry.fn) {
      report(
        entry.name,
        entry.node,
        `${kind} ${entry.note ?? "is not a function the check can read"}`,
      );
      return;
    }
    checked.add(entry.fn);
    const problem = guardProblem(entry.fn);
    if (problem) report(entry.name, entry.node, `${kind} ${problem}`);
  };

  const moduleIsServer = directives(source.statements).names.includes("use server");
  if (moduleIsServer) for (const entry of exportsOf(source)) check(entry, "server action");

  if (isRouteFile(file))
    for (const entry of exportsOf(source))
      if ((MUTATING_METHODS as readonly string[]).includes(entry.name))
        check(entry, `${entry.name} handler`);

  for (const fn of inlineServerFunctions(source)) {
    if (checked.has(fn)) continue;
    const name = functionName(fn, source);
    const problem = guardProblem(fn);
    if (problem) report(name, fn, `inline server action ${problem}`);
  }
  return violations;
}

/** Whether a file needs parsing at all: a cheap text filter before the real parse. */
export function mayHoldMutations(file: string, text: string): boolean {
  return isRouteFile(file) || text.includes("use server");
}

export function formatViolation(violation: Violation): string {
  return `${violation.file}:${violation.line} ${violation.name}: ${violation.problem}`;
}
