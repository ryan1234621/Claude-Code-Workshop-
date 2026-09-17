'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronDown } from 'lucide-react';
import type { Order, OrderItem, ReturnReason } from '@/app/lib/types';
import { getReturnReasonLabel, checkItemEligibility } from '@/app/lib/returns/returnPolicy';
import { cn } from '@/app/lib/utils';

const REASONS: ReturnReason[] = [
  'wrong_size', 'wrong_item', 'defective', 'not_as_described', 'changed_mind', 'other',
];

export interface SelectedItem {
  index: number;
  item: OrderItem;
  reason: ReturnReason;
  quantity: number; // up to item.quantity
}

interface ReturnItemSelectorProps {
  order: Order;
  selected: SelectedItem[];
  onChange: (items: SelectedItem[]) => void;
  error?: string;
}

export function ReturnItemSelector({
  order,
  selected,
  onChange,
  error,
}: ReturnItemSelectorProps) {
  const isSelected = (idx: number) => selected.some((s) => s.index === idx);

  const toggleItem = (idx: number, item: OrderItem) => {
    if (isSelected(idx)) {
      onChange(selected.filter((s) => s.index !== idx));
    } else {
      onChange([
        ...selected,
        { index: idx, item, reason: 'wrong_size', quantity: item.quantity },
      ]);
    }
  };

  const updateField = <K extends keyof SelectedItem>(
    idx: number,
    key: K,
    value: SelectedItem[K]
  ) => {
    onChange(selected.map((s) => (s.index === idx ? { ...s, [key]: value } : s)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wider uppercase text-parmore-slate">
          Select Items to Return
        </p>
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {error}
          </p>
        )}
      </div>

      {order.items.map((item, idx) => {
        const eligibility = checkItemEligibility(item);
        const sel = isSelected(idx);
        const selData = selected.find((s) => s.index === idx);

        return (
          <div key={idx}>
            <label
              className={cn(
                'flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-colors',
                !eligibility.eligible
                  ? 'border-zinc-200 opacity-50 cursor-not-allowed'
                  : sel
                  ? 'border-parmore-gold bg-parmore-gold/5'
                  : 'border-zinc-200 hover:border-zinc-300'
              )}
            >
              <input
                type="checkbox"
                checked={sel}
                disabled={!eligibility.eligible}
                onChange={() => eligibility.eligible && toggleItem(idx, item)}
                className="mt-0.5 h-4 w-4 accent-parmore-gold cursor-pointer shrink-0"
              />

              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.product_name}
                  className="h-14 w-14 rounded-sm object-cover shrink-0"
                />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{item.product_name}</p>
                <p className="text-xs text-parmore-slate mt-0.5">
                  {item.color_name} · Size {item.size}
                  {item.quantity > 1 && ` · Qty ${item.quantity}`}
                </p>
                <p className="text-xs font-semibold mt-1">${item.unit_price.toFixed(2)}</p>
                {!eligibility.eligible && (
                  <p className="text-xs text-red-500 mt-1">{eligibility.reason}</p>
                )}
              </div>
            </label>

            {/* Expanded controls when item is selected */}
            <AnimatePresence>
              {sel && selData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="ml-7 mt-2 pl-3 border-l-2 border-parmore-gold/40 space-y-3 pb-1">
                    {/* Reason */}
                    <div>
                      <label className="block text-xs font-medium text-parmore-slate mb-1">
                        Reason for return
                      </label>
                      <div className="relative">
                        <select
                          value={selData.reason}
                          onChange={(e) =>
                            updateField(idx, 'reason', e.target.value as ReturnReason)
                          }
                          className="w-full appearance-none h-9 pl-3 pr-8 border border-zinc-200 rounded-sm text-sm bg-white focus:outline-none focus:border-parmore-black transition-colors"
                        >
                          {REASONS.map((r) => (
                            <option key={r} value={r}>
                              {getReturnReasonLabel(r)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-parmore-slate pointer-events-none" />
                      </div>
                    </div>

                    {/* Quantity (only if >1) */}
                    {item.quantity > 1 && (
                      <div>
                        <label className="block text-xs font-medium text-parmore-slate mb-1">
                          Qty to return
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={item.quantity}
                          value={selData.quantity}
                          onChange={(e) =>
                            updateField(
                              idx,
                              'quantity',
                              Math.min(
                                item.quantity,
                                Math.max(1, Number(e.target.value))
                              )
                            )
                          }
                          className="w-20 h-9 px-3 border border-zinc-200 rounded-sm text-sm bg-white focus:outline-none focus:border-parmore-black transition-colors"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
