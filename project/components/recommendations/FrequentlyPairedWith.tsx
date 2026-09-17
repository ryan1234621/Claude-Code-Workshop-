'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, ShoppingBag, Loader2 } from 'lucide-react';
import { getIntentContext } from '@/app/lib/recommendations/sessionTracker';
import { getComplements } from '@/app/lib/recommendations/complimentaryRules';
import { useCart } from '@/components/CartProvider';
import { formatPriceRaw, getTotalStock } from '@/app/lib/utils';
import type { Product } from '@/app/lib/types';
import { cn } from '@/app/lib/utils';

interface RecommendationResult {
  product: Product;
  score: number;
  matchedTerms: string[];
}

interface FrequentlyPairedWithProps {
  sourceProduct: Product;
  className?: string;
}

export function FrequentlyPairedWith({ sourceProduct, className }: FrequentlyPairedWithProps) {
  const { addItem, openCart } = useCart();
  const [complements, setComplements] = useState<RecommendationResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set([sourceProduct.id]));
  const [loading, setLoading] = useState(false);
  const [addingAll, setAddingAll] = useState(false);
  const [bundleAdded, setBundleAdded] = useState(false);

  const { rule } = getComplements(sourceProduct);
  const discount = rule?.discountPct ?? 10;
  const bundleName = rule?.bundleName ?? 'Bundle & Save';

  const fetchPaired = useCallback(async () => {
    setLoading(true);
    try {
      const context = getIntentContext({
        complementCategories: getComplements(sourceProduct).complements,
        excludeSlugs: [sourceProduct.slug],
      });

      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, limit: 3 }),
      });

      if (!res.ok) return;
      const data: { results: RecommendationResult[] } = await res.json();
      const inStockResults = data.results.filter((r) => getTotalStock(r.product) > 0);
      setComplements(inStockResults);
      setSelected(new Set([sourceProduct.id, ...inStockResults.map((r) => r.product.id)]));
    } finally {
      setLoading(false);
    }
  }, [sourceProduct]);

  useEffect(() => {
    fetchPaired();
  }, [fetchPaired]);

  if (!loading && complements.length === 0) return null;

  const selectedComplements = complements.filter((r) => selected.has(r.product.id));
  const bundleTotal =
    sourceProduct.price +
    selectedComplements.reduce((sum, r) => sum + r.product.price, 0);
  const discountedTotal = bundleTotal * (1 - discount / 100);

  const toggleProduct = (id: string) => {
    if (id === sourceProduct.id) return; // source product is always in bundle
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddBundle = async () => {
    setAddingAll(true);
    for (const { product } of selectedComplements) {
      const variant = product.variants.find((v) => v.sizes.some((s) => s.stock > 0));
      if (!variant) continue;
      const size = variant.sizes.find((s) => s.stock > 0);
      if (!size) continue;
      addItem(product, variant, variant.color, size.label);
    }
    setAddingAll(false);
    setBundleAdded(true);
    openCart();
    setTimeout(() => setBundleAdded(false), 3000);
  };

  return (
    <section className={cn('py-8 border-t border-zinc-100', className)} aria-label="Frequently paired with">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-parmore-black">{bundleName}</h2>
        <p className="text-xs text-parmore-slate mt-0.5">
          Buy together &amp; save {discount}%
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-6">
          <Loader2 className="h-5 w-5 text-parmore-gold animate-spin" />
          <span className="text-xs text-parmore-slate">Finding perfect pairings…</span>
        </div>
      ) : (
        <>
          {/* Product row */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {/* Source product — always selected */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative h-20 w-20 rounded-sm overflow-hidden border-2 border-parmore-gold bg-zinc-50">
                <Image
                  src={sourceProduct.images[0]}
                  alt={sourceProduct.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <p className="text-2xs font-medium text-parmore-black text-center w-20 truncate">
                {sourceProduct.name}
              </p>
              <p className="text-2xs text-parmore-slate">{formatPriceRaw(sourceProduct.price)}</p>
            </div>

            {complements.map(({ product }, idx) => (
              <React.Fragment key={product.id}>
                <Plus className="h-4 w-4 text-zinc-300 shrink-0" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.08 }}
                  className="flex flex-col items-center gap-1.5 cursor-pointer"
                  onClick={() => toggleProduct(product.id)}
                >
                  <div
                    className={cn(
                      'relative h-20 w-20 rounded-sm overflow-hidden border-2 bg-zinc-50 transition-all',
                      selected.has(product.id)
                        ? 'border-parmore-gold'
                        : 'border-zinc-200 opacity-50'
                    )}
                  >
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                    {!selected.has(product.id) && (
                      <div className="absolute inset-0 bg-white/40" />
                    )}
                  </div>
                  <p className="text-2xs font-medium text-parmore-black text-center w-20 truncate">
                    {product.name}
                  </p>
                  <p className="text-2xs text-parmore-slate">{formatPriceRaw(product.price)}</p>
                </motion.div>
              </React.Fragment>
            ))}
          </div>

          {/* Bundle CTA */}
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-parmore-black">
                  {formatPriceRaw(discountedTotal)}
                </span>
                <span className="text-sm text-parmore-slate line-through">
                  {formatPriceRaw(bundleTotal)}
                </span>
                <span className="text-xs font-semibold text-green-600">Save {discount}%</span>
              </div>
              <p className="text-2xs text-parmore-slate mt-0.5">
                {selectedComplements.length + 1} items selected
              </p>
            </div>

            <button
              onClick={handleAddBundle}
              disabled={addingAll || bundleAdded || selectedComplements.length === 0}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm font-semibold transition-all',
                bundleAdded
                  ? 'bg-green-500 text-white'
                  : 'bg-parmore-black text-white hover:bg-parmore-gold hover:text-parmore-black disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <ShoppingBag className="h-4 w-4" />
              {bundleAdded ? 'Added to Bag!' : addingAll ? 'Adding…' : 'Add Bundle to Bag'}
            </button>
          </div>

          {/* Individual links */}
          <div className="mt-4 flex flex-wrap gap-3">
            {complements.map(({ product }) => (
              <Link
                key={product.id}
                href={`/shop/${product.slug}`}
                className="text-2xs text-parmore-slate hover:text-parmore-gold hover:underline transition-colors"
              >
                View {product.name}
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
