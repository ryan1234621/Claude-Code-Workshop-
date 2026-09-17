'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Package, ChevronRight } from 'lucide-react';
import { QuickAddPill } from '@/components/ui/QuickAddPill';
import { getIntentContext } from '@/app/lib/recommendations/sessionTracker';
import { getComplements } from '@/app/lib/recommendations/complimentaryRules';
import { useCart } from '@/components/CartProvider';
import { formatPriceRaw, getTotalStock } from '@/app/lib/utils';
import type { Product } from '@/app/lib/types';
import { cn } from '@/app/lib/utils';

const FREE_SHIPPING_THRESHOLD = 150;

interface RecommendationResult {
  product: Product;
  score: number;
  matchedTerms: string[];
}

interface CompleteTheKitProps {
  /** The product currently being viewed — used to derive complement categories. */
  sourceProduct?: Product;
  className?: string;
}

export function CompleteTheKit({ sourceProduct, className }: CompleteTheKitProps) {
  const { cart } = useCart();
  const [products, setProducts] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const subtotal = cart.subtotal;
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const fetchKit = useCallback(async () => {
    setLoading(true);
    try {
      const context = getIntentContext({
        complementCategories: sourceProduct
          ? getComplements(sourceProduct).complements
          : undefined,
        excludeSlugs: sourceProduct ? [sourceProduct.slug] : undefined,
      });

      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, limit: 4 }),
      });

      if (!res.ok) return;
      const data: { results: RecommendationResult[] } = await res.json();
      setProducts(data.results.filter((r) => getTotalStock(r.product) > 0));
    } finally {
      setLoading(false);
    }
  }, [sourceProduct]);

  useEffect(() => {
    fetchKit();
  }, [fetchKit]);

  if (dismissed || (!loading && products.length === 0)) return null;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className={cn(
            'bg-parmore-cream/60 border border-parmore-gold/20 rounded-sm p-4',
            className
          )}
          aria-label="Complete the kit"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-parmore-gold" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-parmore-black">Complete the Kit</span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss kit suggestions"
              className="p-1 text-parmore-slate hover:text-parmore-black transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Free-shipping progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-2xs text-parmore-slate">
                <Package className="h-3 w-3" />
                {amountToFreeShipping > 0 ? (
                  <span>
                    Add <span className="font-semibold text-parmore-black">{formatPriceRaw(amountToFreeShipping)}</span> for free shipping
                  </span>
                ) : (
                  <span className="font-semibold text-green-600">You&apos;ve unlocked free shipping!</span>
                )}
              </div>
              <span className="text-2xs text-parmore-slate">{Math.round(shippingProgress)}%</span>
            </div>
            <div className="h-1 bg-zinc-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-parmore-gold rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${shippingProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Products */}
          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-zinc-100 rounded-sm animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {products.map(({ product }) => (
                <div
                  key={product.id}
                  className="relative bg-white rounded-sm overflow-hidden border border-zinc-100 group"
                >
                  <Link href={`/shop/${product.slug}`} className="block">
                    <div className="relative h-24 bg-zinc-50">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 45vw, 140px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="px-2 pt-1.5 pb-1">
                      <p className="text-2xs font-semibold text-parmore-black truncate leading-snug">
                        {product.name}
                      </p>
                      <p className="text-2xs text-parmore-slate">{formatPriceRaw(product.price)}</p>
                    </div>
                  </Link>
                  <div className="px-2 pb-2">
                    <QuickAddPill product={product} className="w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View all */}
          <Link
            href="/shop"
            className="flex items-center justify-center gap-1 mt-3 text-2xs font-medium text-parmore-slate hover:text-parmore-gold transition-colors"
          >
            Browse more <ChevronRight className="h-3 w-3" />
          </Link>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
