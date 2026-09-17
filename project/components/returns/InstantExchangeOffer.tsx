'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Zap, X, ChevronDown, Check } from 'lucide-react';
import type { SelectedItem } from './ReturnItemSelector';
import { Button } from '@/components/ui/Button';
import { cn } from '@/app/lib/utils';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'OSFM'];

export interface ExchangeChoice {
  itemIndex: number;
  newSize: string;
  newColor?: string;
}

interface InstantExchangeOfferProps {
  items: SelectedItem[];
  onAccept: (choices: ExchangeChoice[]) => void;
  onDecline: () => void;
}

export function InstantExchangeOffer({
  items,
  onAccept,
  onDecline,
}: InstantExchangeOfferProps) {
  const [choices, setChoices] = useState<ExchangeChoice[]>(
    items.map((s) => ({ itemIndex: s.index, newSize: s.item.size }))
  );

  const setSize = (itemIndex: number, newSize: string) => {
    setChoices((prev) =>
      prev.map((c) => (c.itemIndex === itemIndex ? { ...c, newSize } : c))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 8 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-sm border border-parmore-gold bg-white shadow-luxury overflow-hidden"
    >
      {/* Header */}
      <div className="bg-parmore-gold px-5 py-3 flex items-center gap-2.5">
        <Zap className="h-4 w-4 text-parmore-black shrink-0" fill="currentColor" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-parmore-black">Instant Exchange Available</p>
          <p className="text-xs text-parmore-black/70">
            Ship your replacement now — no waiting for us to receive your return.
          </p>
        </div>
      </div>

      {/* Item rows */}
      <div className="px-5 py-4 space-y-4">
        {items.map((sel) => {
          const choice = choices.find((c) => c.itemIndex === sel.index)!;
          const otherSizes = SIZES.filter((s) => s !== sel.item.size);

          return (
            <div key={sel.index} className="flex items-start gap-3">
              {sel.item.image_url && (
                <img
                  src={sel.item.image_url}
                  alt={sel.item.product_name}
                  className="h-14 w-14 rounded-sm object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{sel.item.product_name}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {/* Current size */}
                  <span className="text-xs text-parmore-slate">
                    Size <span className="line-through">{sel.item.size}</span>
                  </span>
                  <ArrowLeftRight className="h-3.5 w-3.5 text-parmore-slate shrink-0" />
                  {/* New size selector */}
                  <div className="relative">
                    <select
                      value={choice.newSize}
                      onChange={(e) => setSize(sel.index, e.target.value)}
                      className="appearance-none h-8 pl-2.5 pr-7 border border-parmore-gold rounded-sm text-sm font-semibold bg-white focus:outline-none transition-colors"
                    >
                      {SIZES.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                          {sz === sel.item.size ? ' (current)' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-parmore-gold pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Perks */}
      <div className="px-5 pb-4">
        {[
          'Free overnight shipping on your replacement',
          'No charge until your return is received',
          'Keeps your order history intact',
        ].map((perk) => (
          <div key={perk} className="flex items-start gap-2 mt-1.5">
            <Check className="h-3.5 w-3.5 text-parmore-gold mt-0.5 shrink-0" strokeWidth={2.5} />
            <span className="text-xs text-parmore-slate">{perk}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-2">
        <Button
          variant="gold"
          size="md"
          onClick={() => onAccept(choices)}
          className="flex-1"
        >
          <Zap className="h-4 w-4" fill="currentColor" />
          Yes — Exchange Now
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={onDecline}
          className="flex-1 text-parmore-slate"
        >
          No, just a return
        </Button>
      </div>
    </motion.div>
  );
}
