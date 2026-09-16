/** The storefront and admin panel use the PHP API hosted on api.skleup.com. */
export const API_BASE_URL = 'https://api.skleup.com/api/ecommerce';

export const isExternalApiConfigured = (): boolean => {
  return Boolean(API_BASE_URL && API_BASE_URL.startsWith('http'));
};
