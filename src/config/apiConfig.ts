/**
 * API CONFIGURATION
 * Allows dynamic pointing to external Core PHP REST API endpoint or local backend proxy
 */

export const API_BASE_URL = 
  (typeof window !== 'undefined' && (window as any).__ECOMMERCE_API_URL__) ||
  ((import.meta as any).env && (import.meta as any).env.VITE_ECOMMERCE_API_URL) ||
  '/api';

export const isExternalApiConfigured = (): boolean => {
  return Boolean(API_BASE_URL && API_BASE_URL.startsWith('http'));
};
