import { Product } from '../types';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export function getProductSlug(product: Product): string {
  if (product.slug) return product.slug;
  return slugify(product.name);
}

export function getProductPath(product: Product): string {
  return `/products/${getProductSlug(product)}`;
}

export function findProductBySlugOrId(products: Product[], identifier: string): Product | undefined {
  if (!identifier) return undefined;
  const clean = identifier.toLowerCase().trim();
  
  return products.find(
    (p) =>
      p.id.toLowerCase() === clean ||
      (p.slug && p.slug.toLowerCase() === clean) ||
      slugify(p.name) === clean
  );
}

export function syncURLPath(path: string, title?: string) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname !== path) {
    window.history.pushState({ path }, title || document.title, path);
  }
}
