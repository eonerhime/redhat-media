// The kinds of project each service takes, as typed config (Phase 19 spec, D1, Appendix B). The
// stepper's second step asks for at least one per chosen service; inquiryInputSchema
// (lib/validation/inquiry.ts) checks the ids. No prices: these are kinds of work, not packages.
// Adding or removing a type is a code change; its label is a block key.

import type { BlockKey } from "../lib/content/block";
import type { ServiceCategory } from "./services";

/** A service's "Not sure yet" type. It stands alone in its service (D1). */
export const NOT_SURE = "NOT_SURE";

export type ProjectTypeId = `${ServiceCategory}.${string}`;

export type ProjectType = { id: ProjectTypeId; labelKey: BlockKey };

// In display order, "Not sure yet" last. Keys are contact.form.types.<service id>.<type>.
export const projectTypes = {
  PHOTOGRAPHY: [
    { id: "PHOTOGRAPHY.EVENT", labelKey: "contact.form.types.photography.event" },
    { id: "PHOTOGRAPHY.PRODUCT", labelKey: "contact.form.types.photography.product" },
    { id: "PHOTOGRAPHY.PORTRAIT", labelKey: "contact.form.types.photography.portrait" },
    { id: "PHOTOGRAPHY.BRAND", labelKey: "contact.form.types.photography.brand" },
    { id: "PHOTOGRAPHY.NOT_SURE", labelKey: "contact.form.types.photography.notSure" },
  ],
  VIDEOGRAPHY: [
    { id: "VIDEOGRAPHY.PROMO", labelKey: "contact.form.types.videography.promo" },
    { id: "VIDEOGRAPHY.EVENT", labelKey: "contact.form.types.videography.event" },
    { id: "VIDEOGRAPHY.INTERVIEW", labelKey: "contact.form.types.videography.interview" },
    { id: "VIDEOGRAPHY.SOCIAL", labelKey: "contact.form.types.videography.social" },
    { id: "VIDEOGRAPHY.NOT_SURE", labelKey: "contact.form.types.videography.notSure" },
  ],
  DIGITAL_MARKETING: [
    { id: "DIGITAL_MARKETING.LAUNCH", labelKey: "contact.form.types.digitalMarketing.launch" },
    { id: "DIGITAL_MARKETING.ADS", labelKey: "contact.form.types.digitalMarketing.ads" },
    { id: "DIGITAL_MARKETING.AUDIT", labelKey: "contact.form.types.digitalMarketing.audit" },
    { id: "DIGITAL_MARKETING.NOT_SURE", labelKey: "contact.form.types.digitalMarketing.notSure" },
  ],
  SOCIAL_MEDIA: [
    { id: "SOCIAL_MEDIA.MANAGEMENT", labelKey: "contact.form.types.socialMedia.management" },
    { id: "SOCIAL_MEDIA.CONTENT", labelKey: "contact.form.types.socialMedia.content" },
    { id: "SOCIAL_MEDIA.CAMPAIGN", labelKey: "contact.form.types.socialMedia.campaign" },
    { id: "SOCIAL_MEDIA.NOT_SURE", labelKey: "contact.form.types.socialMedia.notSure" },
  ],
  ONLINE_PRESENCE: [
    { id: "ONLINE_PRESENCE.SETUP", labelKey: "contact.form.types.onlinePresence.setup" },
    { id: "ONLINE_PRESENCE.UPKEEP", labelKey: "contact.form.types.onlinePresence.upkeep" },
    { id: "ONLINE_PRESENCE.RECOVERY", labelKey: "contact.form.types.onlinePresence.recovery" },
    { id: "ONLINE_PRESENCE.NOT_SURE", labelKey: "contact.form.types.onlinePresence.notSure" },
  ],
  WEB_APP: [
    { id: "WEB_APP.WEBSITE", labelKey: "contact.form.types.webApp.website" },
    { id: "WEB_APP.WEB_APP", labelKey: "contact.form.types.webApp.webApp" },
    { id: "WEB_APP.SHOP", labelKey: "contact.form.types.webApp.shop" },
    { id: "WEB_APP.IMPROVE", labelKey: "contact.form.types.webApp.improve" },
    { id: "WEB_APP.NOT_SURE", labelKey: "contact.form.types.webApp.notSure" },
  ],
} as const satisfies Record<ServiceCategory, readonly ProjectType[]>;

/** Every known id, in service then display order. */
export const projectTypeIds: readonly string[] = Object.values(projectTypes).flatMap((list) =>
  list.map((type) => type.id),
);

const known = new Set(projectTypeIds);

export const isProjectTypeId = (value: string): value is ProjectTypeId => known.has(value);

/** The service an id belongs to: the part before the dot. */
export const categoryOf = (id: ProjectTypeId): ServiceCategory =>
  id.slice(0, id.indexOf(".")) as ServiceCategory;

export const isNotSure = (id: string): boolean => id.endsWith(`.${NOT_SURE}`);
