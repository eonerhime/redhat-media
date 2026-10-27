import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { findUnguarded, formatViolation, mayHoldMutations } from "./guard-coverage";
import { PUBLIC_MUTATIONS } from "./public-mutations";

// The unguarded-mutation check (Phase 25 spec, D11), first against fixture
// sources, then over the repo itself. It runs in `pnpm test`, so in the ci job.

const ACTIONS = "app/(public)/example/actions.ts";
const ROUTE = "app/api/example/route.ts";
const names = (file: string, source: string, allow = PUBLIC_MUTATIONS) =>
  findUnguarded(file, source, allow).map((violation) => violation.name);

describe("server action modules", () => {
  it("passes a guarded action, bare or assigned", () => {
    const source = `"use server";
      import { requireRole } from "@/lib/auth/guards";
      export async function save(input: string) {
        const guard = await requireRole("editor");
        if (!guard.ok) return { error: "Not allowed" };
      }
      export async function touch() {
        await requireRole("sales");
      }`;
    expect(names(ACTIONS, source)).toEqual([]);
  });

  it("fails an unguarded action", () => {
    const source = `"use server";
      export async function wipe() { await db.inquiry.deleteMany(); }`;
    const [violation, ...rest] = findUnguarded(ACTIONS, source);
    expect(rest).toEqual([]);
    expect(violation).toMatchObject({ file: ACTIONS, name: "wipe", line: 2 });
    expect(formatViolation(violation!)).toMatch(/actions\.ts:2 wipe: server action does not open/);
  });

  it("fails a guard that is not the first statement", () => {
    const source = `"use server";
      export async function save(input: string) {
        const value = input.trim();
        await requireRole("editor");
      }`;
    expect(names(ACTIONS, source)).toEqual(["save"]);
  });

  it("fails a guard that only a helper calls", () => {
    const source = `"use server";
      async function check() { await requireRole("editor"); }
      export async function save() { await check(); }`;
    expect(names(ACTIONS, source)).toEqual(["save"]);
  });

  it("fails a guard that is not awaited, or a lookalike", () => {
    const source = `"use server";
      export async function a() { requireRole("editor"); }
      export async function b() { await auth.requireRole("editor"); }
      export async function c() { if (!(await requireRole("editor")).ok) return; }`;
    expect(names(ACTIONS, source)).toEqual(["a", "b", "c"]);
  });

  it("checks arrow-function exports, and fails an expression body", () => {
    const source = `"use server";
      export const ok = async () => { const g = await requireRole("admin"); };
      export const bad = async () => db.user.deleteMany();
      export const worse = async () => { await db.user.deleteMany(); };`;
    expect(names(ACTIONS, source)).toEqual(["bad", "worse"]);
  });

  it("follows export lists and default exports to the local function", () => {
    const source = `"use server";
      async function guarded() { await requireRole("editor"); }
      async function open() { await db.x.create(); }
      export { guarded, open as renamed };
      export default open;`;
    expect(names(ACTIONS, source)).toEqual(["renamed", "default"]);
  });

  it("fails what it cannot read: re-exports and wrapped functions", () => {
    const source = `"use server";
      export { save } from "./elsewhere";
      export const wrapped = withLogging(async () => { await requireRole("editor"); });`;
    expect(names(ACTIONS, source)).toEqual(["*", "wrapped"]);
  });

  it("allows the allowlisted public action only in its own file", () => {
    const source = `"use server";
      export async function submitInquiry(prev: unknown, data: FormData) { return save(data); }`;
    expect(names("app/(public)/contact/actions.ts", source)).toEqual([]);
    expect(names(ACTIONS, source)).toEqual(["submitInquiry"]);
  });
});

describe("inline server actions", () => {
  it('checks a function with its own "use server" directive', () => {
    const source = `export default function Page() {
        async function save(data: FormData) {
          "use server";
          await db.x.update();
        }
        const remove = async () => {
          "use server";
          await requireRole("editor");
        };
        return <form action={save} />;
      }`;
    expect(names("app/(public)/page.tsx", source)).toEqual(["save"]);
  });

  it("ignores ordinary functions in ordinary modules", () => {
    const source = `export async function load() { return db.x.findMany(); }`;
    expect(names("lib/content/load.ts", source)).toEqual([]);
  });
});

describe("route handlers", () => {
  it("checks POST, PUT, PATCH and DELETE, and leaves GET alone", () => {
    const source = `
      export async function GET() { return Response.json({}); }
      export async function POST(request: Request) {
        const guard = await requireRole("editor");
        if (!guard.ok) return guardResponse(guard);
        return Response.json({});
      }
      export async function PUT() { return Response.json({}); }
      export const PATCH = async () => Response.json({});
      async function remove() { return new Response(null); }
      export { remove as DELETE };`;
    expect(names(ROUTE, source)).toEqual(["PUT", "PATCH", "DELETE"]);
  });

  it("does not treat a lib file's POST export as a route", () => {
    expect(names("lib/api/client.ts", "export async function POST() {}")).toEqual([]);
  });

  it("allows the Better Auth route's POST through the allowlist", () => {
    const source = `async function handle(request: Request) { return auth.handler(request); }
      export { handle as GET, handle as POST };`;
    expect(names("app/api/auth/[...all]/route.ts", source)).toEqual([]);
    expect(names("app/api/other/[...all]/route.ts", source)).toEqual(["POST"]);
  });
});

// ---- The repo itself ----

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const SCAN = ["app", "lib", "components"];
const SKIP = new Set(["node_modules", ".next", "generated", "testing"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return SKIP.has(entry.name) ? [] : sourceFiles(rel);
    return /\.(ts|tsx|js|mjs)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [rel] : [];
  });
}

describe("the repo (roadmap: CI fails when a new unguarded action is added)", () => {
  const files = SCAN.flatMap(sourceFiles).map((file) => ({
    file,
    text: readFileSync(path.join(ROOT, file), "utf8"),
  }));

  it("has no unguarded server action or mutating route handler", () => {
    const violations = files
      .filter(({ file, text }) => mayHoldMutations(file, text))
      .flatMap(({ file, text }) => findUnguarded(file, text, PUBLIC_MUTATIONS));
    expect(violations.map(formatViolation)).toEqual([]);
  });

  it("finds every allowlisted entry, so a stale one is noticed", () => {
    for (const entry of PUBLIC_MUTATIONS) {
      const found = files.find(({ file }) => file === entry.file);
      expect(found, entry.file).toBeDefined();
      expect(findUnguarded(entry.file, found!.text, []).map((v) => v.name)).toContain(entry.name);
    }
  });
});
