import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN, sentryEnabled } from "@/lib/sentry-env";

if (sentryEnabled) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
