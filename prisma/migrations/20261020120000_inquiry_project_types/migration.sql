-- Phase 19 spec, D2: the project types of an inquiry, as CATEGORY.TYPE ids
-- from content/project-types.ts (checked by Zod, not an enum). Additive only:
-- Phase 18 rows read back with an empty list. Table-level grants already cover
-- the new column; rhm_readonly still has no access to "Inquiry" (Phase 17, D4).

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "projectTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
