// The backup codes as a plain-text file (Phase 24 spec, D7 as amended 2026-10-26).
// The file is built in the browser and never sent anywhere.

export const backupCodesFileName = "redhat-media-backup-codes.txt";

/** The file's text: which site the codes are for, when they were made, and the codes. */
export function backupCodesText(codes: readonly string[], host: string, createdAt: Date): string {
  return [
    "RedHat Media staff: two-factor backup codes",
    `Site: ${host}`,
    `Created: ${createdAt.toISOString()}`,
    "",
    "Each code signs you in once if you lose your phone.",
    "Store them in your password manager, then delete this file.",
    "",
    ...codes.map((code, index) => `${String(index + 1).padStart(2, " ")}. ${code}`),
    "",
  ].join("\n");
}

/** Saves the codes through a temporary object URL, revoked straight after the click. */
export function downloadBackupCodes(codes: readonly string[]): void {
  const text = backupCodesText(codes, window.location.host, new Date());
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = backupCodesFileName;
  link.click();
  URL.revokeObjectURL(url);
}
