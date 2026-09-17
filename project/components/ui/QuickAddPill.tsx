'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShoppingBag } from 'lucide-react';
import type { Product, ProductVariant, ProductColor } from '@/app/lib/types';
import { useCart } from '@/components/CartProvider';
import { cn } from '@/app/lib/utils';

interface QuickAddPillProps {
  product: Product;
  className?: string;
  onAdded?: () => void;
}

type Step = 'idle' | 'picking-color' | 'picking-size' | 'added';

export function QuickAddPill({ product, className, onAdded }: QuickAddPillProps) {
  const { addItem } = useCart();
  const [step, setStep] = useState<Step>('idle');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const variants = product.variants.filter((v) =>
    v.sizes.some((s) => s.stock > 0)
  );

  const handleTrigger = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (variants.length === 0) return;
    if (variants.length === 1) {
      setSelectedVariant(variants[0]);
      setStep('picking-size');
    } else {
      setStep('picking-color');
    }
  };

  const handleColorSelect = (e: React.MouseEvent, variant: ProductVariant) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariant(variant);
    setStep('picking-size');
  };

  const handleSizeSelect = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedVariant) return;
    addItem(product, selectedVariant, selectedVariant.color, size);
    setStep('added');
    onAdded?.();
    setTimeout(() => setStep('idle'), 2200);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStep('idle');
    setSelectedVariant(null);
  };

  const inStock = variants.length > 0;

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait">
        {step === 'idle' && (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            onClick={handleTrigger}
            disabled={!inStock}
            aria-label={`Quick add ${product.name} to bag`}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-2xs font-semibold tracking-wide transition-all',
              inStock
                ? 'bg-parmore-black text-white hover:bg-parmore-gold hover:text-parmore-black'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            )}
          >
            <ShoppingBag className="h-3 w-3" />
            Quick Add
          </motion.button>
        )}

        {step === 'picking-color' && (
          <motion.div
            key="colors"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1 p-1 bg-white border border-zinc-200 rounded-full shadow-sm"
          >
            {variants.slice(0, 5).map((v) => (
              <button
                key={v.id}
                onClick={(e) => handleColorSelect(e, v)}
                aria-label={`Select color ${v.color.name}`}
                title={v.color.name}
                className="h-5 w-5 rounded-full border-2 border-white ring-1 ring-zinc-300 hover:ring-parmore-gold transition-all"
                style={{ backgroundColor: v.color.hex }}
              />
            ))}
            <button
              onClick={handleDismiss}
              className="ml-0.5 text-2xs text-zinc-400 hover:text-zinc-700 px-1"
              aria-label="Cancel"
            >
              ✕
            </button>
          </motion.div>
        )}

        {step === 'picking-size' && selectedVariant && (
          <motion.div
            key="sizes"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1 p-1 bg-white border border-zinc-200 rounded-full shadow-sm"
          >
            {selectedVariant.sizes
              .filter((s) => s.stock > 0)
              .map((s) => (
                <button
                  key={s.label}
                  onClick={(e) => handleSizeSelect(e, s.label)}
                  className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-zinc-100 hover:bg-parmore-gold hover:text-parmore-black transition-colors"
                >
                  {s.label}
                </button>
              ))}
            <button
              onClick={handleDismiss}
              className="ml-0.5 text-2xs text-zinc-400 hover:text-zinc-700 px-1"
              aria-label="Cancel"
            >
              ✕
            </button>
          </motion.div>
        )}

        {step === 'added' && (
          <motion.div
            key="added"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500 text-white text-2xs font-semibold"
          >
            <Check className="h-3 w-3" />
            Added!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
