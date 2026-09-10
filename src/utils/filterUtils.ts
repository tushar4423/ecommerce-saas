import { Category, Product, FilterState } from '../types';

/**
 * Normalizes text for loose, tolerant matching (removes symbols, spaces, accents, lowercase)
 */
export function normalizeText(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if a product matches a category slug (and optional active subcategory)
 */
export function matchProductToCategory(
  product: Product,
  categorySlug: string,
  subcategory?: string,
  categories: Category[] = []
): boolean {
  if (!categorySlug || categorySlug === 'all' || categorySlug === 'search') {
    // If category is "all" or "search", but a subcategory was specified
    if (subcategory && !isAllSubcategory(subcategory)) {
      return matchProductToSubcategory(product, subcategory);
    }
    return true;
  }

  const slug = categorySlug.toLowerCase().trim();
  const currentCategory = categories.find(
    (c) => c.slug.toLowerCase() === slug || normalizeText(c.name) === normalizeText(slug)
  );

  // 1. New Arrivals Virtual Category
  if (slug === 'new-arrivals' || slug === 'new' || slug === 'fresh-arrivals') {
    const isNew = Boolean(
      product.isNewArrival ||
      product.badge?.toLowerCase().includes('new') ||
      product.tags?.some((t) => t.toLowerCase().includes('new') || t.toLowerCase().includes('arrival')) ||
      product.collections?.some((c) => c.toLowerCase().includes('new') || c.toLowerCase().includes('arrival')) ||
      product.category?.toLowerCase().includes('new') ||
      product.subcategory?.toLowerCase().includes('new')
    );
    if (!isNew) return false;
    if (subcategory && !isAllSubcategory(subcategory)) {
      return matchProductToSubcategory(product, subcategory);
    }
    return true;
  }

  // 2. Plus Size Virtual Category
  if (slug === 'plus-size' || slug === 'plus' || slug === 'curve' || slug === 'plus-size-women') {
    const isPlus = Boolean(
      product.isPlusSize ||
      product.variants?.some((v) => ['2XL', '3XL', '4XL', '5XL', 'XXL', 'XXXL'].includes(v.size.toUpperCase())) ||
      product.tags?.some((t) => t.toLowerCase().includes('plus') || t.toLowerCase().includes('curve')) ||
      product.category?.toLowerCase().includes('plus') ||
      product.subcategory?.toLowerCase().includes('plus')
    );
    if (!isPlus) return false;
    if (subcategory && !isAllSubcategory(subcategory)) {
      return matchProductToSubcategory(product, subcategory);
    }
    return true;
  }

  // 3. Festive & Special Occasions
  if (
    slug === 'festive-specials' ||
    slug === 'festive' ||
    slug === 'luxe-festive' ||
    slug === 'festive-chanderi' ||
    slug === 'offers' ||
    slug === 'wedding-edit'
  ) {
    const isFestive = Boolean(
      product.isFestive ||
      product.occasion?.toLowerCase().includes('festive') ||
      product.occasion?.toLowerCase().includes('party') ||
      product.occasion?.toLowerCase().includes('wedding') ||
      product.occasion?.toLowerCase().includes('puja') ||
      product.occasion?.toLowerCase().includes('celebration') ||
      product.collections?.some((c) => c.toLowerCase().includes('festive') || c.toLowerCase().includes('zari') || c.toLowerCase().includes('chanderi')) ||
      product.tags?.some((t) => t.toLowerCase().includes('festive') || t.toLowerCase().includes('party') || t.toLowerCase().includes('wedding') || t.toLowerCase().includes('zari')) ||
      product.work?.toLowerCase().includes('zari') ||
      product.work?.toLowerCase().includes('gotta') ||
      product.work?.toLowerCase().includes('sequin') ||
      product.work?.toLowerCase().includes('chikankari') ||
      product.category?.toLowerCase().includes('sharara') ||
      product.category?.toLowerCase().includes('anarkali') ||
      product.subcategory?.toLowerCase().includes('sharara') ||
      product.subcategory?.toLowerCase().includes('anarkali') ||
      product.subcategory?.toLowerCase().includes('festive')
    );
    if (!isFestive) return false;
    if (subcategory && !isAllSubcategory(subcategory)) {
      return matchProductToSubcategory(product, subcategory);
    }
    return true;
  }

  // 4. Bestsellers Virtual Category
  if (slug === 'bestsellers' || slug === 'bestseller') {
    const isBest = Boolean(product.isBestseller || product.rating >= 4.7 || (product.reviewCount && product.reviewCount >= 20));
    if (!isBest) return false;
    if (subcategory && !isAllSubcategory(subcategory)) {
      return matchProductToSubcategory(product, subcategory);
    }
    return true;
  }

  // 5. Trending
  if (slug === 'trending') {
    const isTrend = Boolean(product.isTrending || product.rating >= 4.6);
    if (!isTrend) return false;
    if (subcategory && !isAllSubcategory(subcategory)) {
      return matchProductToSubcategory(product, subcategory);
    }
    return true;
  }

  // 6. Men's Category
  if (slug === 'men' || slug === 'men-ethnic-topwear' || slug === 'cat-men') {
    const isMen = Boolean(
      product.gender === 'Men' ||
      product.category?.toLowerCase() === 'men' ||
      product.subcategory?.toLowerCase().includes('men') ||
      product.subcategory?.toLowerCase().includes('nehru') ||
      product.subcategory?.toLowerCase().includes('ethnic topwear') ||
      product.tags?.some((t) => t.toLowerCase().includes('men') || t.toLowerCase().includes('nehru'))
    );
    if (!isMen) return false;
    if (subcategory && !isAllSubcategory(subcategory)) {
      return matchProductToSubcategory(product, subcategory);
    }
    return true;
  }

  // 7. Women's Top-Level Category
  if (slug === 'women' || slug === 'cat-women') {
    // In an ethnic boutique, women wear is anything not exclusively Men's
    const isNotMen = product.gender !== 'Men' && product.category?.toLowerCase() !== 'men';
    if (!isNotMen) return false;
    if (subcategory && !isAllSubcategory(subcategory)) {
      return matchProductToSubcategory(product, subcategory);
    }
    return true;
  }

  // 8. Kurtis & Kurta Sets Category
  if (
    slug === 'kurtis' ||
    slug === 'kurtas' ||
    slug === 'kurta-sets' ||
    slug === 'cat-kurtis' ||
    slug === 'kurtis-sets' ||
    slug === 'kurtas-kurtis'
  ) {
    const isKurtiOrSet = Boolean(
      product.category?.toLowerCase().includes('kurti') ||
      product.category?.toLowerCase().includes('kurta') ||
      product.category?.toLowerCase().includes('set') ||
      product.category?.toLowerCase().includes('anarkali') ||
      product.category?.toLowerCase().includes('chikankari') ||
      product.category?.toLowerCase().includes('dress') ||
      product.category?.toLowerCase().includes('co-ord') ||
      product.subcategory?.toLowerCase().includes('kurti') ||
      product.subcategory?.toLowerCase().includes('kurta') ||
      product.subcategory?.toLowerCase().includes('set') ||
      product.tags?.some((t) => t.toLowerCase().includes('kurti') || t.toLowerCase().includes('kurta'))
    );
    if (!isKurtiOrSet) return false;
    if (subcategory && !isAllSubcategory(subcategory)) {
      return matchProductToSubcategory(product, subcategory);
    }
    return true;
  }

  // 9. Accessories Category
  if (slug === 'accessories' || slug === 'cat-accessories') {
    const isAcc = Boolean(
      product.category?.toLowerCase().includes('access') ||
      product.category?.toLowerCase().includes('jutti') ||
      product.category?.toLowerCase().includes('mojari') ||
      product.category?.toLowerCase().includes('bag') ||
      product.category?.toLowerCase().includes('potli') ||
      product.category?.toLowerCase().includes('jewel') ||
      product.category?.toLowerCase().includes('footwear') ||
      product.category?.toLowerCase().includes('dupatta') ||
      product.subcategory?.toLowerCase().includes('jutti') ||
      product.subcategory?.toLowerCase().includes('mojari') ||
      product.subcategory?.toLowerCase().includes('bag') ||
      product.subcategory?.toLowerCase().includes('potli') ||
      product.subcategory?.toLowerCase().includes('jewel') ||
      product.subcategory?.toLowerCase().includes('dupatta') ||
      product.tags?.some((t) => t.toLowerCase().includes('accessory') || t.toLowerCase().includes('jutti') || t.toLowerCase().includes('jewellery'))
    );
    if (!isAcc) return false;
    if (subcategory && !isAllSubcategory(subcategory)) {
      return matchProductToSubcategory(product, subcategory);
    }
    return true;
  }

  // 10. General / Custom Category matching (e.g. from Admin Dashboard)
  const normSlug = normalizeText(slug);
  const normCatName = currentCategory ? normalizeText(currentCategory.name) : '';
  const normProdCat = normalizeText(product.category);
  const normProdSub = normalizeText(product.subcategory);

  let matchesCategory =
    normProdCat === normSlug ||
    (normCatName && normProdCat === normCatName) ||
    normProdCat.includes(normSlug) ||
    normSlug.includes(normProdCat) ||
    product.collections?.some((c) => normalizeText(c).includes(normSlug) || normSlug.includes(normalizeText(c))) ||
    product.tags?.some((t) => normalizeText(t).includes(normSlug) || normSlug.includes(normalizeText(t)));

  // If not matched directly, check if the currentCategory's declared subcategories match the product
  if (!matchesCategory && currentCategory) {
    if (currentCategory.subcategories && currentCategory.subcategories.length > 0) {
      matchesCategory = currentCategory.subcategories.some((sc) => {
        const normSc = normalizeText(sc);
        return normProdCat.includes(normSc) || normSc.includes(normProdCat) || normProdSub.includes(normSc) || normSc.includes(normProdSub);
      });
    }

    if (!matchesCategory && currentCategory.subMenus && currentCategory.subMenus.length > 0) {
      matchesCategory = currentCategory.subMenus.some((sm) => {
        const normSm = normalizeText(sm.name);
        if (normProdCat.includes(normSm) || normProdSub.includes(normSm)) return true;
        return sm.subcategories?.some((ssc) => {
          const normSsc = normalizeText(ssc.name);
          return normProdCat.includes(normSsc) || normProdSub.includes(normSsc);
        });
      });
    }
  }

  if (!matchesCategory) return false;

  // Apply subcategory if provided
  if (subcategory && !isAllSubcategory(subcategory)) {
    return matchProductToSubcategory(product, subcategory);
  }

  return true;
}

/**
 * Checks if a subcategory string is a generic "All" placeholder
 */
function isAllSubcategory(subcat: string): boolean {
  const norm = normalizeText(subcat);
  return (
    norm === 'all' ||
    norm.startsWith('all') ||
    norm.startsWith('exploreall') ||
    norm.startsWith('viewall') ||
    norm.startsWith('shopall') ||
    norm === ''
  );
}

/**
 * Flexible matching for subcategory, styles, crafts, sizes, and fabrics
 */
export function matchProductToSubcategory(product: Product, subcategory: string): boolean {
  if (!subcategory || isAllSubcategory(subcategory)) return true;

  const subNorm = normalizeText(subcategory);

  // 1. Check if it's a "New" subcategory filter
  if (subNorm.includes('new') || subNorm.includes('fresh')) {
    return Boolean(
      product.isNewArrival ||
      product.badge?.toLowerCase().includes('new') ||
      product.tags?.some((t) => t.toLowerCase().includes('new'))
    );
  }

  // 2. Check if subcategory is a specific Size filter (e.g. "Size 2XL", "3XL", "4XL", "5XL")
  const sizeMatches = subcategory.match(/\b(XS|S|M|L|XL|2XL|3XL|4XL|5XL|XXL|XXXL)\b/i);
  if (sizeMatches && sizeMatches[1]) {
    const targetSize = sizeMatches[1].toUpperCase();
    return Boolean(
      product.variants?.some((v) => v.size.toUpperCase() === targetSize) ||
      product.tags?.some((t) => t.toUpperCase() === targetSize)
    );
  }

  // 3. Match against product subcategory, category, fabric, work, occasion, name, and tags
  const normSub = normalizeText(product.subcategory);
  const normCat = normalizeText(product.category);
  const normName = normalizeText(product.name);
  const normFabric = normalizeText(product.fabric);
  const normWork = normalizeText(product.work);
  const normOccasion = normalizeText(product.occasion);
  const normFit = normalizeText(product.fit);

  if (normSub && (normSub.includes(subNorm) || subNorm.includes(normSub))) return true;
  if (normCat && (normCat.includes(subNorm) || subNorm.includes(normCat))) return true;
  if (normWork && (normWork.includes(subNorm) || subNorm.includes(normWork))) return true;
  if (normFabric && (normFabric.includes(subNorm) || subNorm.includes(normFabric))) return true;
  if (normFit && (normFit.includes(subNorm) || subNorm.includes(normFit))) return true;
  if (normOccasion && (normOccasion.includes(subNorm) || subNorm.includes(normOccasion))) return true;
  if (normName && (normName.includes(subNorm) || subNorm.includes(normName))) return true;

  if (product.tags && product.tags.some((t) => {
    const nt = normalizeText(t);
    return nt.includes(subNorm) || subNorm.includes(nt);
  })) {
    return true;
  }

  if (product.collections && product.collections.some((c) => {
    const nc = normalizeText(c);
    return nc.includes(subNorm) || subNorm.includes(nc);
  })) {
    return true;
  }

  return false;
}

/**
 * Cleans conversational noise, query prefixes, and stop words to extract core search tokens.
 * Works like a search engine tokenizer + SQL query builder.
 */
export function extractCleanSearchTokens(rawQuery: string): string[] {
  if (!rawQuery) return [];

  let q = rawQuery.toLowerCase().trim();

  // Strip conversational query phrases in English and Hindi/Hinglish
  const conversationalPhrases = [
    /can you please show me/g,
    /could you please show me/g,
    /can you show me/g,
    /could you show me/g,
    /please show me/g,
    /show me/g,
    /show/g,
    /display/g,
    /find me/g,
    /search for/g,
    /look for/g,
    /i want to see/g,
    /i want/g,
    /i am looking for/g,
    /looking for/g,
    /i need/g,
    /give me/g,
    /for my wife/g,
    /for my mom/g,
    /for my mother/g,
    /for my sister/g,
    /for my daughter/g,
    /for wife/g,
    /for mom/g,
    /for sister/g,
    /for women/g,
    /for ladies/g,
    /for girls/g,
    /for me/g,
    /mujhe dikhao/g,
    /dikhaye/g,
    /dikhao/g,
    /batao/g,
    /chahiye/g,
    /kuch acche/g,
    /kuch accha/g,
  ];

  for (const phrase of conversationalPhrases) {
    q = q.replace(phrase, ' ');
  }

  // Tokenize by punctuation and whitespace
  const rawTokens = q.split(/[\s,+/&|()\-–—_."']+/).filter(Boolean);

  // Stop words to ignore in SQL LIKE matching
  const stopWords = new Set([
    'in', 'for', 'with', 'and', 'of', 'the', 'a', 'an', 'collection', 'collections',
    'items', 'item', 'products', 'product', 'please', 'can', 'you', 'me', 'my', 'wife',
    'to', 'at', 'from', 'is', 'are', 'some', 'any', 'all', 'get', 'give', 'tell', 'want',
    'buy', 'shop', 'online', 'ke', 'ka', 'ki', 'ko', 'se', 'hai', 'hain', 'wala', 'wali',
    'style', 'styles', 'wear', 'ethnic'
  ]);

  const cleanTokens = rawTokens.filter((token) => {
    const clean = token.trim();
    return clean.length >= 2 && !stopWords.has(clean);
  });

  return cleanTokens;
}

/**
 * Checks if a specific token matches a product via SQL LIKE %term% logic across all searchable fields.
 */
export function matchTokenSqlLike(product: Product, token: string): boolean {
  if (!token) return true;
  const t = token.toLowerCase().trim();
  const normT = normalizeText(t);

  // Build searchable text haystack combining all attributes (like SQL CONCAT_WS)
  const searchableText = [
    product.name,
    product.category,
    product.subcategory,
    product.subSubCategory,
    product.fabric,
    product.work,
    product.fit,
    product.occasion,
    product.description,
    product.badge,
    product.sku,
    ...(product.tags || []),
    ...(product.collections || []),
    ...(product.variants?.map((v) => `${v.color} ${v.size}`) || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const normSearchable = normalizeText(searchableText);

  // 1. Direct SQL LIKE %term% substring check
  if (searchableText.includes(t) || normSearchable.includes(normT)) {
    return true;
  }

  // 2. Stemming & Synonym matching for Indian ethnic wear terms
  // Kurtis / Kurta / Kurtas
  if (['kurti', 'kurtis', 'kurta', 'kurtas'].includes(t)) {
    return Boolean(
      searchableText.includes('kurti') ||
      searchableText.includes('kurta') ||
      searchableText.includes('anarkali') ||
      searchableText.includes('chikankari') ||
      searchableText.includes('set') ||
      searchableText.includes('dress') ||
      normSearchable.includes('kurti') ||
      normSearchable.includes('kurta')
    );
  }

  // Suits / Anarkalis
  if (['suit', 'suits', 'anarkali', 'anarkalis'].includes(t)) {
    return Boolean(
      searchableText.includes('suit') ||
      searchableText.includes('anarkali') ||
      searchableText.includes('set') ||
      searchableText.includes('sharara')
    );
  }

  // Co-ords / Sets
  if (['coord', 'coords', 'set', 'sets', 'co-ord', 'co-ords'].includes(t)) {
    return Boolean(
      searchableText.includes('set') ||
      searchableText.includes('coord') ||
      searchableText.includes('co-ord')
    );
  }

  // Fabrics
  if (t === 'cotton' || t === 'sooti') return Boolean(product.fabric?.toLowerCase().includes('cotton') || searchableText.includes('cotton'));
  if (t === 'silk' || t === 'chanderi') return Boolean(product.fabric?.toLowerCase().includes('silk') || searchableText.includes('silk') || searchableText.includes('chanderi'));
  if (t === 'rayon') return Boolean(product.fabric?.toLowerCase().includes('rayon') || searchableText.includes('rayon'));
  if (t === 'georgette') return Boolean(product.fabric?.toLowerCase().includes('georgette') || searchableText.includes('georgette'));

  // Colors
  if (['red', 'laal', 'maroon', 'crimson'].includes(t)) {
    return Boolean(searchableText.includes('red') || searchableText.includes('maroon') || searchableText.includes('crimson') || searchableText.includes('ruby'));
  }
  if (['blue', 'neela', 'navy', 'indigo'].includes(t)) {
    return Boolean(searchableText.includes('blue') || searchableText.includes('navy') || searchableText.includes('indigo'));
  }
  if (['pink', 'gulabi', 'rose'].includes(t)) {
    return Boolean(searchableText.includes('pink') || searchableText.includes('rose') || searchableText.includes('magenta'));
  }
  if (['green', 'hara', 'sage', 'emerald', 'olive'].includes(t)) {
    return Boolean(searchableText.includes('green') || searchableText.includes('sage') || searchableText.includes('emerald') || searchableText.includes('olive'));
  }
  if (['yellow', 'peela', 'mustard', 'haldi'].includes(t)) {
    return Boolean(searchableText.includes('yellow') || searchableText.includes('mustard') || searchableText.includes('haldi') || searchableText.includes('ochre'));
  }

  // New arrivals / Fresh drops
  if (['new', 'fresh', 'arrival', 'arrivals'].includes(t)) {
    return Boolean(
      product.isNewArrival ||
      product.badge?.toLowerCase().includes('new') ||
      searchableText.includes('new') ||
      searchableText.includes('fresh')
    );
  }

  // Singular / Plural suffix stripping (e.g. kurtas -> kurta, prints -> print)
  if (t.endsWith('s') && t.length > 3) {
    const singular = t.slice(0, -1);
    if (searchableText.includes(singular) || normSearchable.includes(normalizeText(singular))) {
      return true;
    }
  }

  return false;
}

/**
 * Applies all user-selected sidebar filters (sizes, colors, fabrics, works, occasions, prices)
 * using an SQL-like LIKE query engine for full search precision.
 */
export function matchProductToFilters(product: Product, filters: FilterState): boolean {
  // Search query (SQL LIKE engine across title, category, description, tags, fabric, and attributes)
  if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
    const cleanTokens = extractCleanSearchTokens(filters.searchQuery);

    if (cleanTokens.length > 0) {
      // Every extracted search keyword must match via SQL LIKE %term%
      const allTokensMatch = cleanTokens.every((token) => matchTokenSqlLike(product, token));
      if (!allTokensMatch) return false;
    } else {
      // Fallback: If all words were conversational (e.g. "show me for wife"), check general category match
      const rawQ = filters.searchQuery.toLowerCase();
      if (rawQ.includes('kurti') || rawQ.includes('kurta') || rawQ.includes('dress') || rawQ.includes('suit')) {
        const isKurtiMatch = matchTokenSqlLike(product, 'kurti');
        if (!isKurtiMatch) return false;
      }
    }
  }

  // Size filter (M, L, XL, 2XL, 3XL, 4XL, 5XL, etc.)
  if (filters.sizes && filters.sizes.length > 0) {
    const productSizes = product.variants?.map((v) => v.size.toUpperCase()) || ['M', 'L', 'XL', 'XXL'];
    const hasMatchingSize = filters.sizes.some((s) => productSizes.includes(s.toUpperCase()));
    if (!hasMatchingSize) return false;
  }

  // Fabric filter
  if (filters.fabrics && filters.fabrics.length > 0) {
    if (!product.fabric) return false;
    const normFab = normalizeText(product.fabric);
    const hasMatchingFabric = filters.fabrics.some((f) => {
      const nf = normalizeText(f);
      return normFab.includes(nf) || nf.includes(normFab);
    });
    if (!hasMatchingFabric) return false;
  }

  // Work filter
  if (filters.works && filters.works.length > 0) {
    if (!product.work) return false;
    const normW = normalizeText(product.work);
    const hasMatchingWork = filters.works.some((w) => {
      const nw = normalizeText(w);
      return normW.includes(nw) || nw.includes(normW);
    });
    if (!hasMatchingWork) return false;
  }

  // Occasion filter
  if (filters.occasions && filters.occasions.length > 0) {
    if (!product.occasion) return false;
    const normOcc = normalizeText(product.occasion);
    const hasMatchingOcc = filters.occasions.some((o) => {
      const no = normalizeText(o);
      return normOcc.includes(no) || no.includes(normOcc);
    });
    if (!hasMatchingOcc) return false;
  }

  // Color filter
  if (filters.colors && filters.colors.length > 0) {
    const productColors = product.variants?.map((v) => v.color.toLowerCase()) || [];
    const hasMatchingColor = filters.colors.some((c) => {
      const clr = c.toLowerCase();
      return productColors.some((pc) => pc.includes(clr) || clr.includes(pc));
    });
    if (!hasMatchingColor) return false;
  }

  // Price range
  if (filters.minPrice !== undefined && product.sellingPrice < filters.minPrice) return false;
  if (filters.maxPrice !== undefined && product.sellingPrice > filters.maxPrice) return false;

  // In stock only
  if (filters.inStockOnly) {
    const totalStock = product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) ?? 10;
    if (totalStock <= 0) return false;
  }

  return true;
}
