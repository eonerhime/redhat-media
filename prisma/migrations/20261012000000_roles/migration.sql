-- Least-privilege grants (Phase 7 spec, D4). Hand-written; applied by
-- rhm_migrator before any table exists, so every table and sequence it
-- creates later is granted automatically.
--
-- The roles themselves, and their USAGE on schema public, come from
-- scripts/db-bootstrap.mts: a committed migration cannot hold passwords.
-- _prisma_migrations predates this migration, so neither role can touch it.

-- Runtime: DML only. No TRUNCATE, REFERENCES or TRIGGER, and it owns nothing.
ALTER DEFAULT PRIVILEGES FOR ROLE rhm_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO rhm_app;

ALTER DEFAULT PRIVILEGES FOR ROLE rhm_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO rhm_app;

-- Support and reporting: read only.
ALTER DEFAULT PRIVILEGES FOR ROLE rhm_migrator IN SCHEMA public
  GRANT SELECT ON TABLES TO rhm_readonly;
