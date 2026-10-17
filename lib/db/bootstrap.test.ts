import { describe, expect, it } from "vitest";
import { bootstrapStatements, neonHosts, roleUrls } from "./bootstrap.mts";

const passwords = { rhm_migrator: "m-pw", rhm_app: "a-pw", rhm_readonly: "r-pw" };
const NEON_OWNER =
  "postgresql://neondb_owner:owner-pw@ep-cool-x1.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

describe("bootstrapStatements", () => {
  it("creates missing roles and re-keys existing ones", () => {
    const sql = bootstrapStatements(passwords, new Set(["rhm_app"]), { dev: false });
    expect(sql[0]).toMatch(/^CREATE ROLE rhm_migrator WITH LOGIN NOCREATEROLE NOCREATEDB /);
    expect(sql[1]).toMatch(/^ALTER ROLE rhm_app WITH LOGIN NOCREATEROLE NOCREATEDB /);
    expect(sql[2]).toMatch(/^CREATE ROLE rhm_readonly /);
  });

  it("gives CREATEDB to the dev migrator only", () => {
    const sql = bootstrapStatements(passwords, new Set(), { dev: true });
    expect(sql.filter((s) => / CREATEDB /.test(s))).toEqual([
      expect.stringMatching(/rhm_migrator/),
    ]);
  });

  it("grants schema rights: CREATE to the migrator only", () => {
    expect(bootstrapStatements(passwords, new Set(), { dev: false }).slice(3)).toEqual([
      "REVOKE CREATE ON SCHEMA public FROM PUBLIC",
      "GRANT USAGE, CREATE ON SCHEMA public TO rhm_migrator",
      "GRANT USAGE ON SCHEMA public TO rhm_app, rhm_readonly",
    ]);
  });

  it("quotes passwords as SQL literals", () => {
    const sql = bootstrapStatements({ ...passwords, rhm_app: "a'b" }, new Set(), { dev: false });
    expect(sql[1]).toMatch(/PASSWORD 'a''b'$/);
  });
});

describe("neonHosts", () => {
  it("derives the pooled host from a direct one, and back", () => {
    const hosts = {
      direct: "ep-cool-x1.eu-west-2.aws.neon.tech",
      pooled: "ep-cool-x1-pooler.eu-west-2.aws.neon.tech",
    };
    expect(neonHosts(hosts.direct)).toEqual(hosts);
    expect(neonHosts(hosts.pooled)).toEqual(hosts);
  });

  it("leaves other hosts alone", () => {
    expect(neonHosts("localhost")).toEqual({ direct: "localhost", pooled: "localhost" });
  });
});

describe("roleUrls", () => {
  it("builds pooled app and direct migrator/readonly URLs with sslmode=require", () => {
    const urls = roleUrls(NEON_OWNER, passwords);
    expect(urls.rhm_app).toBe(
      "postgresql://rhm_app:a-pw@ep-cool-x1-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require",
    );
    expect(urls.rhm_migrator).toBe(
      "postgresql://rhm_migrator:m-pw@ep-cool-x1.eu-west-2.aws.neon.tech/neondb?sslmode=require",
    );
    expect(urls.rhm_readonly).toMatch(/^postgresql:\/\/rhm_readonly:r-pw@ep-cool-x1\.eu/);
  });

  it("never carries the owner password", () => {
    for (const url of Object.values(roleUrls(NEON_OWNER, passwords)))
      expect(url).not.toContain("owner-pw");
  });

  it("keeps a local URL as is, without adding TLS", () => {
    expect(roleUrls("postgresql://postgres:x@localhost:5432/rhm", passwords).rhm_app).toBe(
      "postgresql://rhm_app:a-pw@localhost:5432/rhm",
    );
  });
});
