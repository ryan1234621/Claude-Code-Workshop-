'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import type { Product } from '@/app/lib/types';
import { Badge } from './ui/Badge';
import { formatPriceRaw, getProductBadge, isOnSale } from '@/app/lib/utils';
import { cn } from '@/app/lib/utils';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  variant?: 'default' | 'compact' | 'wide';
}

export function ProductCard({ product, priority = false, variant = 'default' }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const badge = getProductBadge(product);
  const onSale = isOnSale(product);
  const hasSecondImage = product.images.length > 1;

  const handleMouseEnter = () => {
    setHovered(true);
    if (hasSecondImage) setImageIndex(1);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setImageIndex(0);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'group relative flex flex-col',
        variant === 'compact' && 'min-w-[200px]'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image container */}
      <Link href={`/shop/${product.slug}`} className="block relative overflow-hidden bg-parmore-cream rounded-sm">
        <div className="aspect-product relative">
          {/* Primary image */}
          <Image
            src={product.images[imageIndex] ?? product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              'object-cover transition-all duration-700',
              hovered && 'scale-105'
            )}
            priority={priority}
          />

          {/* Overlay on hover */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/10"
          />

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 8 }}
            transition={{ duration: 0.25, delay: hovered ? 0.05 : 0 }}
            className="absolute bottom-3 left-3 right-3 flex gap-2"
          >
            <Link
              href={`/shop/${product.slug}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-parmore-black/90 text-white text-xs font-semibold tracking-wider uppercase rounded-sm hover:bg-parmore-black backdrop-blur-sm transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye className="h-3.5 w-3.5" />
              Quick View
            </Link>
            <button
              aria-label="Add to bag"
              className="p-2.5 bg-parmore-gold text-parmore-black rounded-sm hover:bg-parmore-gold-light transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Quick-add first available variant — full selection on PDP
              }}
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          </motion.div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {badge === 'New' && <Badge variant="new">New</Badge>}
            {badge === 'Best Seller' && <Badge variant="bestseller">Best Seller</Badge>}
            {badge?.includes('%') && <Badge variant="sale">{badge}</Badge>}
          </div>

          {/* Wishlist */}
          <button
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={(e) => {
              e.preventDefault();
              setWishlisted((prev) => !prev);
            }}
            className={cn(
              'absolute top-3 right-3 p-1.5 rounded-full transition-all duration-200',
              'opacity-0 group-hover:opacity-100 focus:opacity-100',
              wishlisted
                ? 'bg-red-50 text-red-500'
                : 'bg-white/80 text-parmore-slate hover:text-red-400 backdrop-blur-sm'
            )}
          >
            <Heart
              className="h-4 w-4"
              fill={wishlisted ? 'currentColor' : 'none'}
              strokeWidth={1.5}
            />
          </button>

          {/* Color swatches */}
          {product.variants.length > 1 && (
            <div className="absolute bottom-14 right-3 flex flex-col gap-1">
              {product.variants.slice(0, 4).map((v) => (
                <div
                  key={v.id}
                  className="h-3 w-3 rounded-full border border-white/60 shadow-sm"
                  style={{ backgroundColor: v.color.hex }}
                  title={v.color.name}
                />
              ))}
              {product.variants.length > 4 && (
                <span className="text-2xs text-white/70 font-medium">+{product.variants.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Product info */}
      <div className="pt-3 pb-1 flex flex-col gap-0.5">
        <p className="text-2xs font-semibold tracking-widest uppercase text-parmore-slate">
          {product.subcategory ?? product.category}
        </p>
        <Link
          href={`/shop/${product.slug}`}
          className="text-sm font-medium text-parmore-black hover:text-parmore-gold transition-colors line-clamp-2 leading-snug"
        >
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2 mt-1">
          <span className={cn('text-sm font-semibold', onSale && 'text-red-600')}>
            {formatPriceRaw(product.price)}
          </span>
          {onSale && product.compare_at_price && (
            <span className="text-xs text-parmore-slate line-through">
              {formatPriceRaw(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
