import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN, sentryEnabled } from "@/lib/sentry-env";

export async function register() {
  if (!sentryEnabled) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({ dsn: SENTRY_DSN, tracesSampleRate: 0.1 });
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({ dsn: SENTRY_DSN, tracesSampleRate: 0.1 });
  }
}

export const onRequestError = Sentry.captureRequestError;
