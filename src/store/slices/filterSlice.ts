import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FilterState } from '../../types';

const initialFilters: FilterState = {
  category: undefined,
  subcategory: undefined,
  sizes: [],
  colors: [],
  fabrics: [],
  works: [],
  occasions: [],
  minPrice: 499,
  maxPrice: 5000,
  sortBy: 'recommended',
  inStockOnly: false,
  searchQuery: '',
};

interface FiltersSliceState {
  filters: FilterState;
  activeCategorySlug: string;
  activeSubcategory?: string;
}

const initialState: FiltersSliceState = {
  filters: initialFilters,
  activeCategorySlug: 'all',
  activeSubcategory: undefined,
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setCategorySlug: (state, action: PayloadAction<{ slug: string; subcategory?: string }>) => {
      state.activeCategorySlug = action.payload.slug;
      state.activeSubcategory = action.payload.subcategory;
      const specialSlugs = [
        'all',
        'search',
        'new-arrivals',
        'new',
        'plus-size',
        'plus',
        'festive-specials',
        'festive',
        'bestsellers',
        'trending',
      ];
      if (!specialSlugs.includes(action.payload.slug.toLowerCase())) {
        state.filters.category = action.payload.slug;
        state.filters.subcategory = action.payload.subcategory;
      } else {
        state.filters.category = undefined;
        state.filters.subcategory = undefined;
      }
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.filters.searchQuery = action.payload;
      state.activeCategorySlug = 'search';
    },
    setFilters: (state, action: PayloadAction<Partial<FilterState>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    toggleSizeFilter: (state, action: PayloadAction<string>) => {
      const size = action.payload;
      if (state.filters.sizes.includes(size)) {
        state.filters.sizes = state.filters.sizes.filter((s) => s !== size);
      } else {
        state.filters.sizes.push(size);
      }
    },
    toggleFabricFilter: (state, action: PayloadAction<string>) => {
      const fabric = action.payload;
      if (state.filters.fabrics.includes(fabric)) {
        state.filters.fabrics = state.filters.fabrics.filter((f) => f !== fabric);
      } else {
        state.filters.fabrics.push(fabric);
      }
    },
    toggleColorFilter: (state, action: PayloadAction<string>) => {
      const color = action.payload;
      if (state.filters.colors.includes(color)) {
        state.filters.colors = state.filters.colors.filter((c) => c !== color);
      } else {
        state.filters.colors.push(color);
      }
    },
    setPriceRange: (state, action: PayloadAction<{ min: number; max: number }>) => {
      state.filters.minPrice = action.payload.min;
      state.filters.maxPrice = action.payload.max;
    },
    setSortBy: (state, action: PayloadAction<FilterState['sortBy']>) => {
      state.filters.sortBy = action.payload;
    },
    resetFilters: (state) => {
      state.filters = initialFilters;
      state.activeCategorySlug = 'all';
      state.activeSubcategory = undefined;
    },
  },
});

export const {
  setCategorySlug,
  setSearchQuery,
  setFilters,
  toggleSizeFilter,
  toggleFabricFilter,
  toggleColorFilter,
  setPriceRange,
  setSortBy,
  resetFilters,
} = filterSlice.actions;

export default filterSlice.reducer;
