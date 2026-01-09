/**
 * Sentry Server Configuration
 * 
 * This file configures Sentry for the Node.js server-side.
 * It captures server errors, API route errors, and provides
 * performance monitoring for server operations.
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

    // Ignore expected errors
    if (error instanceof Error) {
      // Ignore rate limit errors (expected behavior)
      if (error.message.includes('Rate limit exceeded')) {
        return null;
      }

      // Ignore authentication errors (expected for unauthorized access)
      if (error.message.includes('Unauthorized') || error.message.includes('UNAUTHORIZED')) {
        return null;
      }
    }

    return event;
  },

  // Integrations for server-side
  integrations: [
    // Automatically instrument database calls, HTTP requests, etc.
    Sentry.prismaIntegration(),
  ],
});
