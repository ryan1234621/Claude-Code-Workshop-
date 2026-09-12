'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, LayoutGrid, List } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { Select } from '@/components/ui/Select';
import { MOCK_PRODUCTS } from '@/app/lib/mockData';
import type { FilterState, SortOption, ProductCategory } from '@/app/lib/types';
import { cn } from '@/app/lib/utils';
import { useSearchParams } from 'next/navigation';

const SORT_OPTIONS = [
  { value: 'featured',    label: 'Featured' },
  { value: 'newest',      label: 'Newest' },
  { value: 'price-asc',   label: 'Price: Low to High' },
  { value: 'price-desc',  label: 'Price: High to Low' },
  { value: 'best-selling', label: 'Best Selling' },
];

const CATEGORY_FILTERS: { value: ProductCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Products' },
  { value: 'apparel', label: 'Apparel' },
  { value: 'headwear', label: 'Headwear' },
];

const PRICE_RANGES = [
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50 – $100', min: 50, max: 100 },
  { label: '$100 – $150', min: 100, max: 150 },
  { label: 'Over $150', min: 150, max: 99999 },
];

function sortProducts(products: typeof MOCK_PRODUCTS, sortBy: SortOption) {
  return [...products].sort((a, b) => {
    switch (sortBy) {
      case 'newest':      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'price-asc':   return a.price - b.price;
      case 'price-desc':  return b.price - a.price;
      case 'best-selling': return (b.best_seller ? 1 : 0) - (a.best_seller ? 1 : 0);
      default:            return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });
}

export default function ShopPage() {
  const searchParams = useSearchParams();
  const initCategory = (searchParams.get('category') as ProductCategory | 'all') ?? 'all';

  const [filters, setFilters] = useState<FilterState>({
    category: initCategory,
    subcategory: null,
    colors: [],
    sizes: [],
    priceMin: 0,
    priceMax: 99999,
    sortBy: 'featured',
  });
  const [gridView, setGridView] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState({ price: true, size: false });

  const filteredProducts = useMemo(() => {
    let result = MOCK_PRODUCTS;

    if (filters.category !== 'all') {
      result = result.filter((p) => p.category === filters.category);
    }

    const { priceMin, priceMax } = filters;
    if (priceMin > 0 || priceMax < 99999) {
      result = result.filter((p) => p.price >= priceMin && p.price <= priceMax);
    }

    return sortProducts(result, filters.sortBy);
  }, [filters]);

  const setCategory = (category: ProductCategory | 'all') =>
    setFilters((prev) => ({ ...prev, category }));

  const setPriceRange = (min: number, max: number) =>
    setFilters((prev) => ({ ...prev, priceMin: min, priceMax: max }));

  const clearFilters = () =>
    setFilters({ category: 'all', subcategory: null, colors: [], sizes: [], priceMin: 0, priceMax: 99999, sortBy: filters.sortBy });

  const activeFilterCount = [
    filters.category !== 'all',
    filters.priceMin > 0 || filters.priceMax < 99999,
  ].filter(Boolean).length;

  const FilterPanel = () => (
    <aside className="w-full space-y-6">
      {/* Category */}
      <div>
        <p className="label-caps text-parmore-slate mb-3">Category</p>
        <ul className="space-y-1">
          {CATEGORY_FILTERS.map((cat) => (
            <li key={cat.value}>
              <button
                onClick={() => setCategory(cat.value)}
                className={cn(
                  'w-full text-left px-2 py-1.5 text-sm rounded-sm transition-colors',
                  filters.category === cat.value
                    ? 'bg-parmore-black text-white font-medium'
                    : 'text-parmore-black hover:text-parmore-gold hover:bg-zinc-50'
                )}
              >
                {cat.label}
                <span className="ml-auto float-right text-xs text-zinc-400">
                  {cat.value === 'all'
                    ? MOCK_PRODUCTS.length
                    : MOCK_PRODUCTS.filter((p) => p.category === cat.value).length}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div>
        <button
          className="w-full flex items-center justify-between label-caps text-parmore-slate mb-3"
          onClick={() => setExpandedFilters((prev) => ({ ...prev, price: !prev.price }))}
        >
          Price
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expandedFilters.price && 'rotate-180')} />
        </button>
        <AnimatePresence initial={false}>
          {expandedFilters.price && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden space-y-1"
            >
              {PRICE_RANGES.map((range) => {
                const active = filters.priceMin === range.min && filters.priceMax === range.max;
                return (
                  <li key={range.label}>
                    <button
                      onClick={() => active ? setPriceRange(0, 99999) : setPriceRange(range.min, range.max)}
                      className={cn(
                        'w-full text-left px-2 py-1.5 text-sm rounded-sm transition-colors flex items-center gap-2',
                        active
                          ? 'text-parmore-gold font-medium'
                          : 'text-parmore-black hover:text-parmore-gold hover:bg-zinc-50'
                      )}
                    >
                      <span className={cn('h-3.5 w-3.5 rounded-full border flex-shrink-0 transition-colors', active ? 'border-parmore-gold bg-parmore-gold' : 'border-zinc-300')} />
                      {range.label}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="text-xs text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
        >
          <X className="h-3 w-3" /> Clear filters
        </button>
      )}
    </aside>
  );

  return (
    <div className="pt-[var(--navbar-height)]">
      {/* Page header */}
      <div className="bg-parmore-cream border-b border-zinc-200">
        <div className="container-parmore py-10">
          <h1 className="heading-1 mb-1">
            {filters.category === 'all' ? 'All Products' : filters.category === 'apparel' ? 'Apparel' : 'Headwear'}
          </h1>
          <p className="text-sm text-parmore-slate">{filteredProducts.length} products</p>
        </div>
      </div>

      <div className="container-parmore py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Desktop sidebar */}
          <div className="hidden lg:block w-52 xl:w-60 flex-shrink-0">
            <FilterPanel />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-100">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 text-sm font-medium text-parmore-black hover:text-parmore-gold transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="h-4 w-4 rounded-full bg-parmore-gold text-parmore-black text-2xs font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-3 ml-auto">
                {/* Sort */}
                <Select
                  options={SORT_OPTIONS}
                  value={filters.sortBy}
                  onChange={(v) => setFilters((prev) => ({ ...prev, sortBy: v as SortOption }))}
                  className="w-48 text-xs"
                />

                {/* View toggle */}
                <div className="hidden sm:flex items-center gap-1 border border-zinc-200 rounded-sm p-0.5">
                  <button
                    onClick={() => setGridView('grid')}
                    className={cn('p-1.5 rounded-sm transition-colors', gridView === 'grid' ? 'bg-parmore-black text-white' : 'text-parmore-slate hover:text-parmore-black')}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setGridView('list')}
                    className={cn('p-1.5 rounded-sm transition-colors', gridView === 'list' ? 'bg-parmore-black text-white' : 'text-parmore-slate hover:text-parmore-black')}
                    aria-label="List view"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {filters.category !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-parmore-black text-white text-xs rounded-full">
                    {filters.category}
                    <button onClick={() => setCategory('all')} className="ml-1"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {(filters.priceMin > 0 || filters.priceMax < 99999) && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-parmore-black text-white text-xs rounded-full">
                    ${filters.priceMin}–{filters.priceMax < 99999 ? `$${filters.priceMax}` : '+'}
                    <button onClick={() => setPriceRange(0, 99999)} className="ml-1"><X className="h-3 w-3" /></button>
                  </span>
                )}
              </div>
            )}

            {/* Product grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-24">
                <p className="font-serif text-2xl font-bold mb-2">No products found</p>
                <p className="text-parmore-slate text-sm mb-6">Try adjusting your filters.</p>
                <button onClick={clearFilters} className="text-sm font-medium text-parmore-gold hover:underline">Clear all filters</button>
              </div>
            ) : (
              <div
                className={cn(
                  'grid gap-5 md:gap-6',
                  gridView === 'grid'
                    ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
                    : 'grid-cols-1'
                )}
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-semibold text-sm tracking-wide">Filters</span>
                <button onClick={() => setMobileFiltersOpen(false)}><X className="h-5 w-5" /></button>
              </div>
              <FilterPanel />
              <div className="mt-8">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full py-3 bg-parmore-black text-white text-sm font-medium rounded-sm hover:bg-zinc-800 transition-colors"
                >
                  View {filteredProducts.length} Products
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
