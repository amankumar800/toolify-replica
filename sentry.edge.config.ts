/**
 * Sentry Edge Configuration
 * 
 * This file configures Sentry for Edge Runtime (middleware, edge functions).
 * Edge runtime has limited APIs compared to Node.js, so this config is minimal.
 * 
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment configuration
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  // Capture 10% of transactions in production, 100% in development
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Filter out known non-critical errors
  beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint) {
    const error = hint.originalException;

    // Ignore rate limit errors from middleware (expected behavior)
    if (error instanceof Error && error.message.includes('Rate limit')) {
      return null;
    }

    return event;
  },
});
