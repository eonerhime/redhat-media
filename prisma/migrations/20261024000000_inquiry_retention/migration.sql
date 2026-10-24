-- Phase 23 spec, D5-D7: the retention clock and the retention job's grants. Additive only.
-- The ALTER is in the shape prisma migrate dev writes; the GRANTs are hand-written.
-- rhm_retention must already exist on the branch (scripts/db-bootstrap.mts --role
-- rhm_retention), before this migration reaches it (C3).

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "anonymisedAt" TIMESTAMP(3),
ADD COLUMN     "closedAt" TIMESTAMP(3);

-- D7: column-level grants only, so the job can overwrite client details but never read them
-- (C4). It reads the four columns its WHERE clause needs, none of them personal data, and it
-- has no default privileges, no other table and no DDL.
GRANT SELECT ("id", "status", "closedAt", "anonymisedAt"),
  UPDATE ("clientName", "companyName", "email", "phone", "projectNotes", "anonymisedAt")
  ON TABLE "Inquiry" TO rhm_retention;

-- D9: the rate-limit purge filters on "windowEnd" alone.
GRANT SELECT ("windowEnd"), DELETE ON TABLE "RateLimitHit" TO rhm_retention;
