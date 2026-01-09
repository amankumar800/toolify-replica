/**
 * Sentry Client Configuration
 * 
 * This file configures Sentry for the browser/client-side.
 * It captures JavaScript errors, unhandled promise rejections,
 * and provides performance monitoring.
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

  // Session Replay for debugging user issues
  // Capture 10% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Filter out known non-critical errors
  beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint) {
    const error = hint.originalException;

    // Ignore network errors that are expected (e.g., user offline)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return null;
    }

    // Ignore ResizeObserver errors (browser quirk, not actionable)
    if (error instanceof Error && error.message.includes('ResizeObserver')) {
      return null;
    }

    // Ignore hydration errors in development (common during hot reload)
    if (
      process.env.NODE_ENV === 'development' &&
      error instanceof Error &&
      error.message.includes('Hydration')
    ) {
      return null;
    }

    return event;
  },

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      // Mask all text content for privacy
      maskAllText: true,
      // Block all media for privacy
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Ignore specific URLs (e.g., browser extensions)
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    // Firefox extensions
    /^moz-extension:\/\//i,
    // Safari extensions
    /^safari-extension:\/\//i,
  ],
});
