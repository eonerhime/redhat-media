-- Phase 12 spec, D8: an optional https link for the credit line (e.g. the
-- technical lead's personal portfolio). Additive and nullable, so existing rows
-- are untouched; the seed fills it for the engineering case studies.

-- AlterTable
ALTER TABLE "PortfolioItem" ADD COLUMN "creditUrl" TEXT;
