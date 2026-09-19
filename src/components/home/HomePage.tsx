import React from 'react';
import {
  useGetBannersQuery,
  useGetProductsQuery,
  useGetCategoriesQuery,
  useGetHomepageSectionsQuery,
} from '../../store/api/ecommerceApi';
import { INITIAL_HOMEPAGE_SECTIONS, INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../../data/mockData';
import { Product, HomepageSectionConfig } from '../../types';
import { HeroBanner } from './HeroBanner';
import { CategoryStories } from './CategoryStories';
import { FeaturesStrip, GrandOffersStrip } from './GrandOffersStrip';
import { CategoryGrid, ShopBySize } from './CategoryGrid';
import { ProductCarousel } from './ProductCarousel';
import { BrandStory } from './BrandStory';
import { PromoSplitBanner } from './PromoSplitBanner';
import { Testimonials, InstagramGrid } from './Testimonials';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

export interface HomePageProps {
  onSelectProduct: (product: Product) => void;
  onNavigateToCatalog: (categorySlug?: string, subcategory?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectProduct,
  onNavigateToCatalog,
}) => {
  const { data: dynamicSections } = useGetHomepageSectionsQuery();
  const { data: dynamicProducts } = useGetProductsQuery();
  const { data: dynamicCategories } = useGetCategoriesQuery();
  const { data: dynamicBanners } = useGetBannersQuery();

  const products = (dynamicProducts && dynamicProducts.length > 0) ? dynamicProducts : INITIAL_PRODUCTS;
  const categories = (dynamicCategories && dynamicCategories.length > 0) ? dynamicCategories : INITIAL_CATEGORIES;

  // Use configured CMS sections or fallback to INITIAL_HOMEPAGE_SECTIONS
  const sections: HomepageSectionConfig[] = React.useMemo(() => {
    const raw = (dynamicSections && dynamicSections.length > 0) ? dynamicSections : INITIAL_HOMEPAGE_SECTIONS;
    return [...raw]
      .filter((s) => s.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [dynamicSections]);

  const filterProducts = (criteria?: HomepageSectionConfig['filterCriteria'], categorySlug?: string) => {
    let list = [...products];
    const cat = categorySlug || criteria?.category;
    if (cat) {
      const catLower = cat.toLowerCase();
      list = list.filter(
        (p) =>
          p.category?.toLowerCase() === catLower ||
          p.categorySlug?.toLowerCase() === catLower ||
          p.subcategory?.toLowerCase() === catLower ||
          p.tags?.some((t) => t.toLowerCase().includes(catLower))
      );
    }
    if (!criteria) return list.slice(0, 8);
    if (criteria.isBestseller) list = list.filter((p) => p.isBestseller);
    if (criteria.isNewArrival) list = list.filter((p) => p.isNewArrival);
    if (criteria.isTrending) list = list.filter((p) => p.isTrending || p.isBestseller);
    if (criteria.isPlusSize) {
      list = list.filter(
        (p) =>
          p.category === 'plus-size' ||
          p.tags?.includes('plus-size') ||
          p.variants?.some((v) => ['2XL', '3XL', '4XL', '5XL'].includes(v.size))
      );
    }
    if (criteria.isFestive) {
      list = list.filter(
        (p) =>
          p.category === 'anarkalis' ||
          p.category === 'kurta-sets' ||
          p.tags?.includes('festive') ||
          p.name.toLowerCase().includes('zari') ||
          p.name.toLowerCase().includes('anarkali')
      );
    }
    return list.slice(0, criteria.limit || 8);
  };

  const handleSizeSelect = (size: string) => {
    onNavigateToCatalog('all', undefined);
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-stone-50/40">
      {sections.map((section) => {
        switch (section.type) {
          case 'hero_banner_slider':
            return (
              <HeroBanner
                key={section.id}
                banners={dynamicBanners}
                onNavigateToCatalog={onNavigateToCatalog}
              />
            );

          case 'features_strip':
            return (
              <FeaturesStrip
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
              />
            );

          case 'category_circles':
            return (
              <CategoryStories
                key={section.id}
                categories={categories}
                title={section.title}
                subtitle={section.subtitle}
                onSelectCategory={onNavigateToCatalog}
              />
            );

          case 'product_carousel':
          case 'product_grid': {
            const sectionProds = filterProducts(section.filterCriteria, section.categorySlug);
            return (
              <ProductCarousel
                key={section.id}
                title={section.title || 'Curated Silhouettes'}
                subtitle={section.subtitle}
                badge={section.badge || (section.filterCriteria?.isPlusSize ? '2XL-5XL' : undefined)}
                layout={section.layout === 'grid' ? 'grid' : 'carousel'}
                products={sectionProds.length > 0 ? sectionProds : products.slice(0, 8)}
                onSelectProduct={onSelectProduct}
                onViewAll={() =>
                  onNavigateToCatalog(
                    section.categorySlug ||
                      section.filterCriteria?.category ||
                      (section.filterCriteria?.isPlusSize ? 'plus-size' : 'all')
                  )
                }
              />
            );
          }

          case 'collection_banner':
            return (
              <section key={section.id} className="py-8 bg-stone-900 text-white w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="relative rounded-3xl overflow-hidden min-h-[320px] sm:min-h-[400px] flex items-center p-8 sm:p-14 shadow-lg border border-stone-800">
                    <img
                      src={
                        section.imageUrl ||
                        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80'
                      }
                      alt={section.title || 'Special Collection'}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover filter brightness-[0.75]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/50 to-transparent" />

                    <div className="relative z-10 max-w-xl space-y-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        Exclusive Showcase
                      </span>
                      <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight text-white">
                        {section.title || "The Festive Weaves '26"}
                      </h2>
                      <p className="text-sm text-stone-200 leading-relaxed">
                        {section.subtitle ||
                          'Opulent Gotapatti, Zari borders, and hand-embroidered Chanderi kurtas crafted for memorable celebrations.'}
                      </p>
                      <div className="pt-2">
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={() => onNavigateToCatalog('anarkalis')}
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                          {section.ctaText || 'Explore Festive Edit'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );

          case 'promo_split_banner':
            return (
              <PromoSplitBanner
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                onNavigateToCatalog={onNavigateToCatalog}
              />
            );

          case 'brand_story':
            return (
              <BrandStory
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                onNavigateToCatalog={onNavigateToCatalog}
              />
            );

          case 'testimonials':
            return (
              <Testimonials
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                onNavigateToCatalog={onNavigateToCatalog}
              />
            );

          case 'instagram_feed':
            return (
              <InstagramGrid
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                onNavigateToCatalog={onNavigateToCatalog}
              />
            );

          default:
            return null;
        }
      })}

      {/* Always ensure Category Grid & ShopBySize are accessible if not in custom sections */}
      <CategoryGrid
        categories={categories}
        onSelectCategory={onNavigateToCatalog}
        onSelectSize={handleSizeSelect}
      />
      <ShopBySize onSelectSize={handleSizeSelect} />
      <GrandOffersStrip onNavigateToCatalog={onNavigateToCatalog} />
    </div>
  );
};
