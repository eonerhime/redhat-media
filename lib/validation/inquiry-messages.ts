// The inquiry's validation messages (Phase 17 spec, Appendix A; Phase 19 spec, D3, Appendix A).
// Zod-free, so the stepper's step checks show the server's exact text without loading Zod
// (Phase 19 spec, D9). Not block keys (Phase 17 spec, D5).

export const MESSAGES = {
  nameMissing: "Enter your name.",
  nameTooLong: "Your name must be at most 100 characters.",
  nameOneLine: "Your name must be on one line.",
  companyTooLong: "Company name must be at most 120 characters.",
  companyOneLine: "Company name must be on one line.",
  emailInvalid: "Enter a valid email address, like name@example.com.",
  emailTooLong: "Email addresses must be at most 254 characters.",
  phoneMissing: "Enter a phone number we can reach you on.",
  phoneFormat:
    "Enter a phone number like 0803 123 4567, or with a country code like +44 20 7946 0000.",
  servicesMissing: "Choose at least one service.",
  servicesUnknown: "Choose services from the list.",
  servicesRepeat: "Choose each service only once.",
  typesUnknown: "Choose project types from the list.",
  budgetMissing: 'Choose a budget range, or "Not sure yet".',
  budgetUnknown: "Choose a budget range from the list.",
  timelineMissing: 'Choose a timeline, or "Flexible / not sure".',
  timelineUnknown: "Choose a timeline from the list.",
  notesShort: "Tell us a little about your project (at least 10 characters).",
  notesTooLong: "Project details must be at most 5,000 characters.",
  notesCharacters: "Project details contain characters we can't accept.",
  consentMissing: "Please agree to the privacy notice so we can keep your details.",
} as const;

/** No project type chosen for a chosen service. */
export const typesMissing = (service: string) =>
  `Choose at least one kind of project for ${service}.`;

/** A service's "Not sure yet" chosen with its other types. */
export const typesNotSureAlone = (service: string) =>
  `For ${service}, choose "Not sure yet" or the kinds that apply, not both.`;
