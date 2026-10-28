-- Phase 25 spec, D4, D6: the audit log. The CREATE statements are in the shape prisma migrate
-- dev writes; the REVOKEs are hand-written. Additive only.

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "diff" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId", "createdAt");

-- D6: append-only for the runtime. The default privileges (…_roles) gave rhm_app full DML;
-- take back UPDATE and DELETE, so a hijacked app can add to the history but never rewrite it.
REVOKE UPDATE, DELETE ON TABLE "AuditEvent" FROM rhm_app;

-- D6: diffs will hold client details (Phase 32) and staff emails, which rhm_readonly must never
-- read (Phase 17 spec, D4; Phase 24 spec, D15). rhm_retention has no default privileges.
REVOKE ALL ON TABLE "AuditEvent" FROM rhm_readonly;
