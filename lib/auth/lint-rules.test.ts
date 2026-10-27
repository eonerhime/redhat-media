import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// The lint ban on server-side sign-in (Phase 24 spec, D5): it fires in app code
// and stays quiet in scripts and tests.

const SOURCE = `
declare const auth: { api: Record<string, (input: unknown) => Promise<unknown>> };
export async function act() {
  await auth.api.signInEmail({ body: {} });
  await auth.api.verifyTOTP({ body: {} });
  await auth.api.verifyBackupCode({ body: {} });
}
declare const authClient: { twoFactor: { verifyBackupCode: (input: unknown) => Promise<unknown> } };
export const allowed = () => authClient.twoFactor.verifyBackupCode({ code: "x" });
`;

async function restricted(filePath: string): Promise<string[]> {
  const eslint = new ESLint();
  const [result] = await eslint.lintText(SOURCE, { filePath });
  return (result?.messages ?? [])
    .filter((message) => message.ruleId === "no-restricted-syntax")
    .map((message) => message.message);
}

describe("ESLint: no server-side sign-in", () => {
  it("fires on each auth.api call in app code, not on the client API", async () => {
    const messages = await restricted("app/admin/actions.ts");
    expect(messages).toHaveLength(3);
    for (const message of messages) expect(message).toMatch(/client API/);
  }, 60_000);

  it("allows scripts and tests", async () => {
    expect(await restricted("scripts/auth-tool.mts")).toEqual([]);
    expect(await restricted("lib/auth/example.test.ts")).toEqual([]);
  }, 60_000);
});

// The auth test helpers stay out of app code (Phase 25 spec, D10).
describe("ESLint: lib/auth/testing is for tests only", () => {
  const IMPORT = `import { fakeStaff } from "@/lib/auth/testing/fakes";\nexport const f = fakeStaff;\n`;

  async function importErrors(filePath: string): Promise<number> {
    const [result] = await new ESLint().lintText(IMPORT, { filePath });
    return (result?.messages ?? []).filter((m) => m.ruleId === "no-restricted-imports").length;
  }

  it("fires in app, components and lib code", async () => {
    expect(await importErrors("app/api/cms/example/route.ts")).toBe(1);
    expect(await importErrors("components/cms/example.tsx")).toBe(1);
    expect(await importErrors("lib/auth/example.ts")).toBe(1);
  }, 60_000);

  it("allows tests", async () => {
    expect(await importErrors("lib/auth/example.test.ts")).toBe(0);
    expect(await importErrors("components/cms/example.test.ts")).toBe(0);
  }, 60_000);
});
