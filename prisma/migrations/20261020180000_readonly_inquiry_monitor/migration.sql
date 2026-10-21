-- Phase 20 spec, D10, C6: the hourly monitor (rhm_readonly) counts inquiries whose team
-- notification never went out. It gets SELECT on only the two columns that needs, none of them
-- personal data, so Phase 17 spec D4 still holds: client details are readable only by rhm_app.
-- Grant-only: no table or column definition changes, so the Prisma schema is unchanged.
GRANT SELECT ("createdAt", "emailSentAt") ON TABLE "Inquiry" TO rhm_readonly;
