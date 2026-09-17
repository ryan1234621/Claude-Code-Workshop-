'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { QuickAddPill } from '@/components/ui/QuickAddPill';
import {
  getIntentContext,
  getRecentSlugs,
} from '@/app/lib/recommendations/sessionTracker';
import { getComplements } from '@/app/lib/recommendations/complimentaryRules';
import { formatPriceRaw, isOnSale, discountPercent, getTotalStock } from '@/app/lib/utils';
import type { Product } from '@/app/lib/types';
import { cn } from '@/app/lib/utils';

interface RecommendationResult {
  product: Product;
  score: number;
  matchedTerms: string[];
}

interface PicksForYourGameDrawerProps {
  /** If provided, complement recommendations pivot around this product. */
  sourceProduct?: Product;
  /** Controlled open state — when omitted the drawer manages its own state. */
  isOpen?: boolean;
  onClose?: () => void;
  /** Hides the floating trigger button when controlled externally. */
  hideTrigger?: boolean;
}

export function PicksForYourGameDrawer({
  sourceProduct,
  isOpen: isOpenProp,
  onClose: onCloseProp,
  hideTrigger = false,
}: PicksForYourGameDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalOpen;
  const closeDrawer = onCloseProp ?? (() => setInternalOpen(false));
  const openDrawer = () => setInternalOpen(true);

  const [results, setResults] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextLabel, setContextLabel] = useState<string>('Based on your browsing');

  const fetchPicks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const context = getIntentContext({
        complementCategories: sourceProduct
          ? getComplements(sourceProduct).complements
          : undefined,
        excludeSlugs: sourceProduct ? [sourceProduct.slug] : undefined,
      });

      // Build a dynamic header label
      const recentSlugs = getRecentSlugs(3);
      if (sourceProduct) {
        const { rule } = getComplements(sourceProduct);
        setContextLabel(rule ? `${rule.bundleName} picks` : `Pairs with ${sourceProduct.name}`);
      } else if (recentSlugs.length > 0) {
        setContextLabel('Picks based on your recent views');
      } else {
        setContextLabel('Curated picks for your game');
      }

      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, limit: 8 }),
      });

      if (!res.ok) throw new Error('Failed to load picks');
      const data: { results: RecommendationResult[] } = await res.json();
      setResults(data.results.filter((r) => getTotalStock(r.product) > 0));
    } catch {
      setError('Could not load your picks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [sourceProduct]);

  useEffect(() => {
    if (isOpen) fetchPicks();
  }, [isOpen, fetchPicks]);

  // Keyboard + scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeDrawer();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, closeDrawer]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Floating trigger */}
      <AnimatePresence>
        {!hideTrigger && !isOpen && (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 16 }}
            transition={{ duration: 0.25 }}
            onClick={openDrawer}
            aria-label="Open picks for your game"
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 pl-3.5 pr-4 py-2.5 bg-parmore-black text-white rounded-full shadow-luxury-lg hover:bg-zinc-800 transition-colors group"
          >
            <Sparkles
              className="h-4 w-4 text-parmore-gold group-hover:animate-pulse"
              strokeWidth={1.5}
            />
            <span className="text-xs font-medium">Picks For You</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[2px]"
            onClick={closeDrawer}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col"
            role="complementary"
            aria-label="Picks for your game"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-parmore-gold mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <h2 className="text-sm font-semibold text-parmore-black">Picks For Your Game</h2>
                  <p className="text-2xs text-parmore-slate mt-0.5 leading-snug">{contextLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-3">
                {!loading && (
                  <button
                    onClick={fetchPicks}
                    aria-label="Refresh picks"
                    className="p-1.5 rounded-sm text-parmore-slate hover:text-parmore-black hover:bg-zinc-100 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={closeDrawer}
                  aria-label="Close"
                  className="p-1.5 rounded-sm text-parmore-slate hover:text-parmore-black hover:bg-zinc-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-6 w-6 text-parmore-gold animate-spin" />
                  <p className="text-xs text-parmore-slate">Finding your picks…</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
                  <p className="text-sm font-medium text-parmore-black">Something went wrong</p>
                  <p className="text-xs text-parmore-slate">{error}</p>
                  <button
                    onClick={fetchPicks}
                    className="text-xs text-parmore-gold hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
                  <Sparkles className="h-8 w-8 text-zinc-300" strokeWidth={1} />
                  <p className="text-sm font-medium">No picks yet</p>
                  <p className="text-xs text-parmore-slate">
                    Browse some products and we&apos;ll personalise your picks.
                  </p>
                </div>
              ) : (
                <div className="px-4 py-4 space-y-3">
                  <AnimatePresence mode="popLayout">
                    {results.map(({ product, matchedTerms }, i) => {
                      const onSale = isOnSale(product);
                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ delay: i * 0.04, duration: 0.2 }}
                          className="flex gap-3 p-2 rounded-sm border border-transparent hover:border-parmore-gold/30 hover:bg-parmore-cream/20 transition-all group"
                        >
                          {/* Image */}
                          <Link
                            href={`/shop/${product.slug}`}
                            onClick={closeDrawer}
                            className="relative h-20 w-20 rounded-sm overflow-hidden shrink-0 bg-zinc-50"
                          >
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              sizes="80px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {onSale && (
                              <div className="absolute top-1 left-1 px-1 py-0.5 bg-parmore-gold text-parmore-black text-2xs font-bold rounded-sm leading-none">
                                -{discountPercent(product.compare_at_price!, product.price)}%
                              </div>
                            )}
                          </Link>

                          {/* Details */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <div>
                              <Link
                                href={`/shop/${product.slug}`}
                                onClick={closeDrawer}
                                className="text-xs font-semibold text-parmore-black hover:text-parmore-gold transition-colors line-clamp-2 leading-snug"
                              >
                                {product.name}
                              </Link>
                              <p className="text-2xs text-parmore-slate capitalize mt-0.5">
                                {product.subcategory ?? product.category}
                              </p>
                              <div className="flex items-baseline gap-1.5 mt-1">
                                <span className="text-sm font-semibold text-parmore-black">
                                  {formatPriceRaw(product.price)}
                                </span>
                                {onSale && (
                                  <span className="text-2xs text-parmore-slate line-through">
                                    {formatPriceRaw(product.compare_at_price!)}
                                  </span>
                                )}
                              </div>
                              {matchedTerms.length > 0 && (
                                <p className="text-2xs text-parmore-slate mt-0.5 truncate">
                                  {matchedTerms.slice(0, 2).join(' · ')}
                                </p>
                              )}
                            </div>
                            <QuickAddPill product={product} className="mt-2" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {results.length > 0 && !loading && (
              <div className="shrink-0 border-t border-zinc-100 px-5 py-4">
                <Link
                  href="/shop"
                  onClick={closeDrawer}
                  className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-parmore-black hover:text-parmore-gold transition-colors"
                >
                  Browse full catalog
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
