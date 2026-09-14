'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, Loader2 } from 'lucide-react';
import { RecommendedProductCard } from './RecommendedProductCard';
import { getTopTerms } from '@/app/lib/searchHistory';
import type { Product } from '@/app/lib/types';
import { cn } from '@/app/lib/utils';

interface RecommendationResult {
  product: Product;
  score: number;
  matchedTerms: string[];
}

interface DrawerState {
  isOpen: boolean;
  loading: boolean;
  results: RecommendationResult[];
  terms: string[];
  error: string | null;
}

export function RecommendedDrawer() {
  const [state, setState] = useState<DrawerState>({
    isOpen: false,
    loading: false,
    results: [],
    terms: [],
    error: null,
  });

  const fetchRecommendations = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      // Gather terms from the client-side search history for richer personalization
      const localTerms = getTopTerms(8);
      const params = localTerms.length
        ? `?terms=${encodeURIComponent(localTerms.join(' '))}&limit=6`
        : '?limit=6';

      const res = await fetch(`/api/recommendations${params}`);
      if (!res.ok) throw new Error('Failed to fetch recommendations');

      const data: { results: RecommendationResult[]; terms: string[] } = await res.json();
      setState((s) => ({
        ...s,
        loading: false,
        results: data.results,
        terms: data.terms,
      }));
    } catch {
      setState((s) => ({ ...s, loading: false, error: 'Could not load recommendations.' }));
    }
  }, []);

  const open = () => {
    setState((s) => ({ ...s, isOpen: true }));
    fetchRecommendations();
  };

  const close = () => setState((s) => ({ ...s, isOpen: false }));

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isOpen) close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state.isOpen]);

  // Lock body scroll while open
  useEffect(() => {
    if (state.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [state.isOpen]);

  const hasTerms = state.terms.length > 0;

  return (
    <>
      {/* Floating trigger */}
      <AnimatePresence>
        {!state.isOpen && (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 16 }}
            transition={{ duration: 0.25 }}
            onClick={open}
            aria-label="Open personalized recommendations"
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 pl-3.5 pr-4 py-2.5 bg-parmore-black text-white rounded-full shadow-luxury-lg hover:bg-zinc-800 transition-colors group"
          >
            <Sparkles
              className="h-4 w-4 text-parmore-gold group-hover:animate-pulse"
              strokeWidth={1.5}
            />
            <span className="text-xs font-medium">For You</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {state.isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[2px]"
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/* Slide-over panel */}
      <AnimatePresence>
        {state.isOpen && (
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col"
            role="complementary"
            aria-label="Personalized recommendations"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-parmore-gold" strokeWidth={1.5} />
                <div>
                  <h2 className="text-sm font-semibold">Picked For You</h2>
                  {hasTerms && (
                    <p className="text-2xs text-parmore-slate mt-0.5">
                      Based on your recent searches
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={close}
                aria-label="Close recommendations"
                className="p-1.5 rounded-sm text-parmore-slate hover:text-parmore-black hover:bg-zinc-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {state.loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-6 w-6 text-parmore-gold animate-spin" />
                  <p className="text-xs text-parmore-slate">Finding your picks…</p>
                </div>
              ) : state.error ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
                  <p className="text-sm font-medium text-parmore-black">Something went wrong</p>
                  <p className="text-xs text-parmore-slate">{state.error}</p>
                  <button
                    onClick={fetchRecommendations}
                    className="mt-2 text-xs text-parmore-gold hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : state.results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
                  <Sparkles className="h-8 w-8 text-zinc-300" strokeWidth={1} />
                  <p className="text-sm font-medium">No picks yet</p>
                  <p className="text-xs text-parmore-slate px-4">
                    Search for products and we'll personalize your recommendations.
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-1">
                    {state.results.map(({ product, matchedTerms }) => (
                      <RecommendedProductCard
                        key={product.id}
                        product={product}
                        matchedTerms={matchedTerms}
                        onNavigate={close}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {state.results.length > 0 && !state.loading && (
              <div className="shrink-0 border-t border-zinc-100 px-5 py-4">
                <a
                  href="/shop"
                  onClick={close}
                  className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-parmore-black hover:text-parmore-gold transition-colors"
                >
                  Browse full catalog
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
