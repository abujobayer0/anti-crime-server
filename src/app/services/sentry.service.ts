import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

export class SentryService {
  static initialize(dsn?: string, environment?: string): void {
    if (!dsn) return;

    Sentry.init({
      dsn,
      environment: environment || "development",
      tracesSampleRate: 0.2,
      profilesSampleRate: 0.1,
      integrations: [nodeProfilingIntegration()],
    });

    console.info("Sentry initialized for error monitoring");
  }

  static captureException(error: Error): void {
    Sentry.captureException(error);
  }

  static captureMessage(
    message: string,
    level: Sentry.SeverityLevel = "info"
  ): void {
    Sentry.captureMessage(message, level);
  }
}
