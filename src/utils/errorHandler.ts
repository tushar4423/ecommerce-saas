/**
 * Centralized, user-friendly error formatting and sanitization.
 * Strips raw stack traces, DB internals, and returns human-readable Indian ethnic e-commerce feedback.
 */

export interface AppError {
  message: string;
  code?: string | number;
  details?: string;
}

export function formatErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred. Please try again.'): string {
  if (!error) return fallbackMessage;

  if (typeof error === 'string') {
    return sanitizeErrorString(error);
  }

  if (typeof error === 'object') {
    const err = error as Record<string, any>;

    // Handle RTK Query / Fetch Error shapes
    if (err.data && typeof err.data === 'object' && err.data.message) {
      return sanitizeErrorString(err.data.message);
    }

    if (err.status) {
      if (err.status === 404) return 'The requested product, collection, or order was not found.';
      if (err.status === 401) return 'Your session has expired. Please sign in to continue.';
      if (err.status === 403) return 'You do not have permission to perform this action.';
      if (err.status === 429) return 'Too many requests. Please wait a moment and try again.';
      if (err.status >= 500) return 'Our fashion servers are temporarily busy. Please try again shortly.';
      if (err.status === 'FETCH_ERROR') return 'Network connectivity issue. Please check your internet connection.';
    }

    if (err.message && typeof err.message === 'string') {
      return sanitizeErrorString(err.message);
    }
  }

  return fallbackMessage;
}

function sanitizeErrorString(raw: string): string {
  // If it's a JSON string from Firestore error handler or server
  try {
    if (raw.startsWith('{') && raw.endsWith('}')) {
      const parsed = JSON.parse(raw);
      if (parsed.error) return sanitizeErrorString(parsed.error);
    }
  } catch {}

  // Filter known internal error messages
  if (raw.includes('permission-denied') || raw.includes('Missing or insufficient permissions')) {
    return 'Permission denied. Please verify your administrative or customer account privileges.';
  }
  if (raw.includes('quota-exceeded') || raw.includes('Resource has been exhausted')) {
    return 'Service request limit reached. Please retry in a few moments.';
  }
  if (raw.includes('network') || raw.includes('Failed to fetch') || raw.includes('NetworkError')) {
    return 'Unable to reach the store servers. Please check your internet connection.';
  }
  if (raw.includes('inventory') || raw.includes('out of stock')) {
    return 'Selected size or color is currently out of stock.';
  }
  if (raw.includes('coupon') || raw.includes('discount')) {
    return raw;
  }

  // Prevent leaking internal paths or SQL/Firestore syntax
  if (raw.includes('firestore') || raw.includes('collection') || raw.includes('sql') || raw.includes('at Object.')) {
    return 'We encountered an error processing this request. Our technical team has been notified.';
  }

  return raw;
}
