"use server";

import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { visibleServices } from "@/lib/content/services";
import type { InquiryResult } from "@/lib/inquiry/fields";
import { submitInquiryCore } from "@/lib/inquiry/submit-core";
import { clientIp } from "@/lib/security/client-ip";
import { rateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";

/**
 * The inquiry form's action (Phase 18 spec, D3), for `useActionState`. Guarded by
 * Turnstile, the honeypot, the time check and the per-IP limits in the core, not
 * by a session: it is public (Phase 25 allowlists it).
 */
export async function submitInquiry(_prev: InquiryResult, formData: FormData) {
  const ip = clientIp(await headers());
  return submitInquiryCore(formData, ip, {
    enabled: env.inquiryForm !== undefined,
    now: () => new Date(),
    rateLimit,
    verifyTurnstile,
    visibleCategories: async () => (await visibleServices()).map((service) => service.category),
    save: async (data) => {
      await getDb().inquiry.create({ data, select: { id: true } });
    },
  });
}
