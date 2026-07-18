export const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? "";

/** Sentry only activates once a DSN is configured; inert otherwise. */
export const sentryEnabled = SENTRY_DSN.length > 0;
