'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Clock, Sparkles, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { MOCK_PRODUCTS } from '@/app/lib/mockData';
import { tokenize } from '@/app/lib/recommendationEngine';
import { appendEvent, getRecentQueries } from '@/app/lib/searchHistory';
import { formatPriceRaw, getProductBadge, cn } from '@/app/lib/utils';
import type { Product } from '@/app/lib/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Debounce delay before we log a search event (avoids logging every keystroke)
const LOG_DEBOUNCE_MS = 800;

// ─── Result Rendering ─────────────────────────────────────────────────────────

function ResultItem({
  product,
  query,
  onSelect,
}: {
  product: Product;
  query: string;
  onSelect: () => void;
}) {
  const badge = getProductBadge(product);
  return (
    <Link
      href={`/shop/${product.slug}`}
      onClick={onSelect}
      className="group flex items-center gap-3 px-4 py-3 hover:bg-parmore-cream/50 transition-colors"
    >
      <div className="relative h-12 w-12 rounded-sm overflow-hidden shrink-0 bg-zinc-100">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="48px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-parmore-black truncate">{product.name}</p>
        <p className="text-xs text-parmore-slate capitalize">
          {product.subcategory ?? product.category}
          {badge && <span className="ml-1.5 text-parmore-gold font-medium">· {badge}</span>}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold">{formatPriceRaw(product.price)}</p>
        {product.compare_at_price && (
          <p className="text-xs text-parmore-slate line-through">
            {formatPriceRaw(product.compare_at_price)}
          </p>
        )}
      </div>
      <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-parmore-gold transition-colors shrink-0 ml-1" strokeWidth={1.5} />
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const logTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when modal opens; reload recent queries
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setRecentQueries(getRecentQueries(5));
      setQuery('');
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Cmd+K / Ctrl+K to close if already open (toggle handled in parent)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Debounced search event logging
  const logSearchEvent = useCallback((q: string) => {
    if (logTimerRef.current) clearTimeout(logTimerRef.current);
    logTimerRef.current = setTimeout(() => {
      if (!q.trim()) return;
      const terms = tokenize(q);
      // Persist to localStorage for the recommendation engine
      appendEvent({ query: q.trim(), terms, timestamp: new Date().toISOString() });
      // Fire-and-forget to the server (server-side in-memory store)
      fetch('/api/search-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim(), page: window.location.pathname }),
      }).catch(() => { /* non-critical */ });
    }, LOG_DEBOUNCE_MS);
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length >= 2) logSearchEvent(val);
  };

  // Close and log navigation
  const handleSelect = useCallback(() => {
    if (query.trim()) {
      const terms = tokenize(query);
      appendEvent({ query: query.trim(), terms, timestamp: new Date().toISOString() });
    }
    onClose();
  }, [query, onClose]);

  // Filter products client-side
  const results = useMemo<Product[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const tokens = tokenize(q);

    return MOCK_PRODUCTS.filter((p) => {
      if (p.status !== 'active') return false;
      const haystack = [
        p.name,
        p.description,
        p.category,
        p.subcategory ?? '',
        ...p.tags,
        ...p.variants.map((v) => v.color.name),
      ].join(' ').toLowerCase();

      return tokens.some((t) => haystack.includes(t)) || haystack.includes(q);
    }).slice(0, 8);
  }, [query]);

  // Group results by category
  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of results) {
      const key = p.category.charAt(0).toUpperCase() + p.category.slice(1);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return [...map.entries()];
  }, [results]);

  const isEmpty = query.trim().length < 2;
  const noResults = !isEmpty && results.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="search-panel"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed top-[calc(var(--navbar-height)+16px)] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl mx-auto px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
          >
            <div className="bg-white rounded-sm shadow-2xl overflow-hidden border border-zinc-100">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100">
                <Search className="h-4 w-4 text-parmore-slate shrink-0" strokeWidth={1.5} />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={handleQueryChange}
                  placeholder="Search products, collections, styles…"
                  autoComplete="off"
                  spellCheck={false}
                  className="flex-1 text-sm text-parmore-black placeholder-zinc-400 bg-transparent outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="p-1 rounded-sm text-parmore-slate hover:text-parmore-black hover:bg-zinc-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-zinc-100 rounded text-2xs text-parmore-slate font-mono shrink-0">
                  Esc
                </kbd>
              </div>

              {/* Body */}
              <div className="max-h-[60vh] overflow-y-auto">
                {/* Recent searches */}
                {isEmpty && recentQueries.length > 0 && (
                  <div className="px-4 py-3">
                    <p className="flex items-center gap-1.5 text-2xs font-semibold tracking-wider uppercase text-parmore-slate mb-2">
                      <Clock className="h-3 w-3" />
                      Recent
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentQueries.map((q) => (
                        <button
                          key={q}
                          onClick={() => setQuery(q)}
                          className="px-3 py-1 rounded-full text-xs text-parmore-black bg-zinc-100 hover:bg-parmore-cream hover:text-parmore-gold transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Browse shortcuts (shown when no query) */}
                {isEmpty && recentQueries.length === 0 && (
                  <div className="px-4 py-5 text-center">
                    <Package className="h-8 w-8 text-zinc-200 mx-auto mb-2" strokeWidth={1} />
                    <p className="text-xs text-parmore-slate">
                      Type to search products, categories, or styles
                    </p>
                    <div className="flex justify-center gap-2 mt-3 flex-wrap">
                      {['Polo', 'Hat', 'Quarter-Zip', 'Pants'].map((term) => (
                        <button
                          key={term}
                          onClick={() => setQuery(term)}
                          className="px-3 py-1 rounded-full text-xs text-parmore-black bg-zinc-100 hover:bg-parmore-cream hover:text-parmore-gold transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results */}
                {!isEmpty && grouped.length > 0 && (
                  <div className="py-1">
                    {grouped.map(([category, products]) => (
                      <div key={category}>
                        <p className="px-4 pt-3 pb-1 text-2xs font-semibold tracking-wider uppercase text-parmore-slate">
                          {category}
                        </p>
                        {products.map((p) => (
                          <ResultItem
                            key={p.id}
                            product={p}
                            query={query}
                            onSelect={handleSelect}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* No results */}
                {noResults && (
                  <div className="py-10 text-center">
                    <p className="text-sm font-medium text-parmore-black mb-1">
                      No results for "{query}"
                    </p>
                    <p className="text-xs text-parmore-slate">
                      Try a different search, or browse the{' '}
                      <Link
                        href="/shop"
                        onClick={handleSelect}
                        className="text-parmore-gold hover:underline"
                      >
                        full catalog
                      </Link>
                      .
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {results.length > 0 && (
                <div className="border-t border-zinc-100 px-4 py-3 flex items-center justify-between">
                  <p className="text-xs text-parmore-slate">
                    {results.length} result{results.length !== 1 ? 's' : ''}
                  </p>
                  <Link
                    href={`/shop?q=${encodeURIComponent(query)}`}
                    onClick={handleSelect}
                    className="flex items-center gap-1 text-xs text-parmore-gold hover:underline"
                  >
                    <Sparkles className="h-3 w-3" />
                    View all results
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
