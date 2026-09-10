import { Product, Category } from '../types';

export interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  product?: Product;
  category?: Category;
  brandName?: string;
}

export function updateSEO({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  product,
  category,
  brandName = 'Nandita Fashion',
}: SEOProps) {
  if (typeof document === 'undefined') return;

  // 1. Page Title
  const finalTitle = title 
    ? `${title} | ${brandName}` 
    : `${brandName} — Handcrafted Ethnic Kurtis & Festive Edit`;
  document.title = finalTitle;

  // 2. Meta Description
  const availableSizes = (product?.variants || []).map((v) => v.size).join(', ') || 'M, L, XL, XXL';
  const finalDescription = description || 
    (product ? `Buy handcrafted ${product.name} in premium ${product.fabric || 'pure cotton / silk'} with ${product.work || 'artisan embroidery'}. Available in sizes ${availableSizes} with COD and Pan-India Delivery.` :
    (category ? `Explore our collection of handcrafted ${category.name} designed with authentic Indian craftsmanship, festive motifs, and sizes M to 5XL.` :
    'Shop authentic handcrafted Indian ethnic wear, silk kurtis, anarkali sets, and festive silhouettes. Available in sizes M to XXL with Pan-India delivery.'));

  setMetaTag('description', finalDescription);
  setMetaTag('og:title', finalTitle, 'property');
  setMetaTag('og:description', finalDescription, 'property');
  setMetaTag('og:type', ogType, 'property');
  setMetaTag('twitter:title', finalTitle);
  setMetaTag('twitter:description', finalDescription);

  // 3. Canonical URL
  const currentUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');
  if (currentUrl) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', currentUrl);
    setMetaTag('og:url', currentUrl, 'property');
  }

  // 4. OG Image
  const primaryImgUrl = product?.images?.find((img) => img.isPrimary)?.url || product?.images?.[0]?.url;
  const image = ogImage || primaryImgUrl || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&q=80';
  setMetaTag('og:image', image, 'property');
  setMetaTag('twitter:image', image);

  // 5. JSON-LD Structured Data Schema
  updateStructuredData({ product, category, brandName, currentUrl, finalTitle, finalDescription, image });
}

function setMetaTag(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let meta = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function updateStructuredData({
  product,
  category,
  brandName,
  currentUrl,
  finalTitle,
  finalDescription,
  image,
}: {
  product?: Product;
  category?: Category;
  brandName: string;
  currentUrl: string;
  finalTitle: string;
  finalDescription: string;
  image: string;
}) {
  const SCRIPT_ID = 'vedaaya-json-ld';
  let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

  if (!script) {
    script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  let schemaData: any;

  if (product) {
    const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 10;
    const imageUrls = (product.images || []).map((img) => (typeof img === 'string' ? img : img.url));

    schemaData = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      image: imageUrls.length > 0 ? imageUrls : [image],
      description: product.description || finalDescription,
      sku: product.sku,
      brand: {
        '@type': 'Brand',
        name: brandName,
      },
      offers: {
        '@type': 'Offer',
        url: currentUrl,
        priceCurrency: 'INR',
        price: product.sellingPrice,
        priceValidUntil: '2027-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: brandName,
        },
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating || 4.8,
        reviewCount: product.reviewCount || 34,
      },
    };
  } else if (category) {
    schemaData = {
      '@context': 'https://schema.org/',
      '@type': 'CollectionPage',
      name: `${category.name} | ${brandName}`,
      description: category.description || finalDescription,
      url: currentUrl,
    };
  } else {
    schemaData = {
      '@context': 'https://schema.org/',
      '@type': 'WebSite',
      name: brandName,
      url: currentUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${currentUrl}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };
  }

  script.textContent = JSON.stringify(schemaData);
}
