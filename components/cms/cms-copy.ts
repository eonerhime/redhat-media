// Fixed staff-area text (Phase 24 spec, D13, D14). Not content blocks: the CMS
// can't edit its own sign-in pages, and the messages must stay generic.

export const cmsCopy = {
  areaName: "RedHat Media staff",
  backToSite: "Back to the website",
  login: {
    title: "Staff sign-in",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    submitting: "Signing in…",
    // tech-stack.md → Architectural rules 6: the same message for every failure.
    invalid: "Invalid email or password",
  },
  twoFactor: {
    title: "Enter your code",
    totpLabel: "6-digit code from your authenticator app",
    backupLabel: "Backup code",
    useBackup: "Use a backup code instead",
    useTotp: "Use your authenticator app instead",
    submit: "Verify",
    submitting: "Checking…",
    invalid: "That code didn't work.",
    expired: "Your sign-in has timed out. Sign in again.",
    signInAgain: "Back to sign-in",
  },
  setup: {
    title: "Set up two-factor sign-in",
    intro:
      "Every staff account needs an authenticator app (Google Authenticator, Microsoft Authenticator, Authy or similar) before it can use the CMS.",
    passwordLabel: "Confirm your password",
    start: "Continue",
    scan: "Scan this QR code with your authenticator app.",
    manual: "Can't scan it? Enter this key in the app instead:",
    qrLabel: "QR code for your authenticator app",
    codeLabel: "Then enter the 6-digit code it shows",
    confirm: "Turn on two-factor sign-in",
    backupTitle: "Save your backup codes",
    backupIntro:
      "Each code signs you in once if you lose your phone. Store them in your password manager now: they won't be shown again.",
    download: "Download as a text file",
    done: "I've saved them. Continue",
    wrongPassword: "That password didn't work.",
    invalidCode: "That code didn't work. Check the time on your phone and try again.",
  },
  panel: {
    signedInAs: "Signed in as",
    comingSoon:
      "Inquiries and staff management arrive here in later releases. Editing will happen on the website itself, through an Editing: On/Off switch.",
    toSite: "Go to the website",
    signOut: "Sign out",
    signingOut: "Signing out…",
  },
  // The floating pill on the public pages (Phase 26 spec, D5).
  editMode: {
    off: "Editing: Off",
    on: "Editing: On",
  },
  rateLimited: "Too many attempts. Try again in a minute.",
  unavailable: "Something went wrong. Try again.",
} as const;
