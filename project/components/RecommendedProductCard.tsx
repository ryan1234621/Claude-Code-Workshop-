'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Check } from 'lucide-react';
import type { Product } from '@/app/lib/types';
import { formatPriceRaw, isOnSale, discountPercent, getTotalStock } from '@/app/lib/utils';
import { useCart } from './CartProvider';
import { cn } from '@/app/lib/utils';

interface RecommendedProductCardProps {
  product: Product;
  matchedTerms?: string[];
  onNavigate?: () => void;
}

export function RecommendedProductCard({ product, matchedTerms, onNavigate }: RecommendedProductCardProps) {
  const { dispatch } = useCart();
  const [added, setAdded] = useState(false);

  const defaultVariant = product.variants[0];
  const defaultColor = defaultVariant?.color;
  const defaultSize = defaultVariant?.sizes.find((s) => s.stock > 0);
  const inStock = getTotalStock(product) > 0;
  const onSale = isOnSale(product);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!defaultVariant || !defaultSize || !inStock || added) return;

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        product_id: product.id,
        variant_id: defaultVariant.id,
        product,
        variant: defaultVariant,
        color: defaultColor,
        size: defaultSize.label,
        quantity: 1,
        unit_price: product.price,
      },
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <Link
        href={`/shop/${product.slug}`}
        onClick={onNavigate}
        className="flex items-center gap-3 p-3 rounded-sm border border-transparent hover:border-parmore-gold/30 hover:bg-parmore-cream/30 transition-all"
      >
        {/* Thumbnail */}
        <div className="relative h-16 w-16 rounded-sm overflow-hidden shrink-0 bg-zinc-100">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="64px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {onSale && (
            <div className="absolute top-1 left-1 px-1 py-0.5 bg-parmore-gold text-parmore-black text-2xs font-bold rounded-sm leading-none">
              -{discountPercent(product.compare_at_price!, product.price)}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-parmore-black truncate leading-snug">
            {product.name}
          </p>
          <p className="text-xs text-parmore-slate capitalize mt-0.5">
            {product.subcategory ?? product.category}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-sm font-semibold text-parmore-black">
              {formatPriceRaw(product.price)}
            </span>
            {onSale && (
              <span className="text-xs text-parmore-slate line-through">
                {formatPriceRaw(product.compare_at_price!)}
              </span>
            )}
          </div>
          {matchedTerms && matchedTerms.length > 0 && (
            <p className="text-2xs text-parmore-slate mt-0.5 truncate">
              Matched: {matchedTerms.slice(0, 3).join(', ')}
            </p>
          )}
        </div>

        {/* Quick Add */}
        <button
          onClick={handleQuickAdd}
          disabled={!inStock || added}
          aria-label={added ? 'Added to bag' : `Add ${product.name} to bag`}
          className={cn(
            'h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200',
            added
              ? 'bg-green-500 text-white scale-110'
              : inStock
              ? 'bg-parmore-black text-white hover:bg-parmore-gold hover:text-parmore-black'
              : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
          )}
        >
          {added ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <ShoppingBag className="h-3.5 w-3.5" />
          )}
        </button>
      </Link>
    </motion.div>
  );
}
