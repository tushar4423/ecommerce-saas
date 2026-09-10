/**
 * Master Firestore and Database Indexing Specification
 * Ensures high-performance queries for search, category filtering, SKU lookups, and order retrieval.
 */

export interface DatabaseIndexDefinition {
  collection: string;
  fields: Array<{ name: string; order: 'ASC' | 'DESC' }>;
  purpose: string;
}

export const DATABASE_INDEXES: DatabaseIndexDefinition[] = [
  {
    collection: 'products',
    fields: [{ name: 'slug', order: 'ASC' }],
    purpose: 'Fast SEO URL lookups (/products/:slug)',
  },
  {
    collection: 'products',
    fields: [{ name: 'sku', order: 'ASC' }],
    purpose: 'Admin and barcode SKU lookups',
  },
  {
    collection: 'products',
    fields: [
      { name: 'category', order: 'ASC' },
      { name: 'status', order: 'ASC' },
      { name: 'createdAt', order: 'DESC' },
    ],
    purpose: 'Storefront category listing sorted by newest',
  },
  {
    collection: 'products',
    fields: [
      { name: 'category', order: 'ASC' },
      { name: 'price', order: 'ASC' },
    ],
    purpose: 'Category browsing sorted by price low-to-high',
  },
  {
    collection: 'products',
    fields: [
      { name: 'status', order: 'ASC' },
      { name: 'createdAt', order: 'DESC' },
    ],
    purpose: 'Admin active product catalog pagination',
  },
  {
    collection: 'orders',
    fields: [{ name: 'orderNumber', order: 'ASC' }],
    purpose: 'Instant order tracking lookup by order ID',
  },
  {
    collection: 'orders',
    fields: [
      { name: 'customerId', order: 'ASC' },
      { name: 'createdAt', order: 'DESC' },
    ],
    purpose: 'Customer order history listing',
  },
  {
    collection: 'orders',
    fields: [
      { name: 'customerEmail', order: 'ASC' },
      { name: 'createdAt', order: 'DESC' },
    ],
    purpose: 'Guest checkout order lookup by email',
  },
  {
    collection: 'orders',
    fields: [
      { name: 'status', order: 'ASC' },
      { name: 'createdAt', order: 'DESC' },
    ],
    purpose: 'Admin fulfillment queues (Pending, Shipped, Processing)',
  },
  {
    collection: 'reviews',
    fields: [
      { name: 'productId', order: 'ASC' },
      { name: 'status', order: 'ASC' },
      { name: 'createdAt', order: 'DESC' },
    ],
    purpose: 'Approved customer product reviews on PDP',
  },
  {
    collection: 'returns',
    fields: [
      { name: 'customerId', order: 'ASC' },
      { name: 'createdAt', order: 'DESC' },
    ],
    purpose: 'Customer return requests history',
  },
];
