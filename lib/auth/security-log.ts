// Security log lines for staff sign-in (Phase 24 spec, D20). One JSON line per
// event on stderr, which Vercel keeps for an hour on Hobby; AuditEvent (Phase 25)
// is the lasting record. The fields are a fixed, typed set: a user ID when one is
// known and a short hash of the client key, never an email address or a password.

export type SecurityEvent =
  | "auth.sign_in_failed"
  | "auth.lockout"
  | "auth.refused_locked"
  | "auth.2fa_failed"
  | "auth.rate_limited";

export type SecurityLogFields = {
  /** Better Auth user ID, when the account is known. */
  userId?: string;
  /** First 12 hex characters of the salted SHA-256 of the client key (IP, or IP and path). */
  keyHash?: string;
  /** The auth endpoint, e.g. "/sign-in/email". */
  path?: string;
};

export type SecurityLogger = (event: SecurityEvent, fields?: SecurityLogFields) => void;

export const securityLog: SecurityLogger = (event, fields = {}) => {
  const line: Record<string, string> = { event };
  // Copy only the known fields, so nothing else can ride along.
  if (fields.userId) line.userId = fields.userId;
  if (fields.keyHash) line.keyHash = fields.keyHash;
  if (fields.path) line.path = fields.path;
  console.warn(JSON.stringify(line));
};
