'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Truck, ChevronDown, RotateCcw, MessageSquarePlus,
  ExternalLink, CheckCircle, Clock, AlertCircle,
} from 'lucide-react';
import type { Order, OrderStatus } from '@/app/lib/types';
import { Button } from './ui/Button';
import { formatPriceRaw, formatDate, orderStatusColor } from '@/app/lib/utils';
import { cn } from '@/app/lib/utils';

const STATUS_CONFIG: Record<OrderStatus, { icon: React.ReactNode; label: string; step: number }> = {
  pending:    { icon: <Clock className="h-3.5 w-3.5" />,        label: 'Order Placed',  step: 0 },
  confirmed:  { icon: <CheckCircle className="h-3.5 w-3.5" />,  label: 'Confirmed',     step: 1 },
  processing: { icon: <Package className="h-3.5 w-3.5" />,      label: 'Processing',    step: 2 },
  shipped:    { icon: <Truck className="h-3.5 w-3.5" />,        label: 'Shipped',       step: 3 },
  delivered:  { icon: <CheckCircle className="h-3.5 w-3.5" />,  label: 'Delivered',     step: 4 },
  cancelled:  { icon: <AlertCircle className="h-3.5 w-3.5" />,  label: 'Cancelled',     step: -1 },
  refunded:   { icon: <RotateCcw className="h-3.5 w-3.5" />,    label: 'Refunded',      step: -1 },
};

const PROGRESS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

interface OrderCardProps {
  order: Order;
  onOpenReturnModal?: (order: Order, itemIndex?: number) => void;
  onOpenTicket?: (order: Order) => void;
}

export function OrderCard({ order, onOpenReturnModal, onOpenTicket }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const statusConfig = STATUS_CONFIG[order.status];
  const currentStep = statusConfig.step;
  const isTerminal = order.status === 'cancelled' || order.status === 'refunded';
  const canReturn = order.status === 'delivered';

  const toggleItem = (idx: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <motion.article
      layout
      className="bg-white rounded-sm border border-zinc-100 shadow-luxury overflow-hidden"
    >
      {/* ─── Header ─── */}
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-50">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-parmore-cream rounded-sm shrink-0">
            <Package className="h-4 w-4 text-parmore-black" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">{order.order_number}</p>
            <p className="text-xs text-parmore-slate mt-0.5">{formatDate(order.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', orderStatusColor(order.status))}>
            {statusConfig.icon}
            {statusConfig.label}
          </span>
          <span className="text-sm font-semibold">{formatPriceRaw(order.total)}</span>
        </div>
      </div>

      {/* ─── Tracking Progress ─── */}
      {!isTerminal && (
        <div className="px-5 py-3 bg-zinc-50/50 border-b border-zinc-50">
          <div className="flex items-center gap-1">
            {PROGRESS_STEPS.map((step, idx) => {
              const cfg = STATUS_CONFIG[step];
              const done = idx <= currentStep;
              const active = idx === currentStep;
              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center gap-1 min-w-0">
                    <div
                      className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center transition-all duration-300',
                        done
                          ? 'bg-parmore-black text-white'
                          : 'bg-zinc-200 text-zinc-400',
                        active && 'ring-2 ring-parmore-gold ring-offset-1'
                      )}
                    >
                      {cfg.icon}
                    </div>
                    <span className={cn('text-2xs hidden sm:block truncate', done ? 'text-parmore-black font-medium' : 'text-zinc-400')}>
                      {cfg.label}
                    </span>
                  </div>
                  {idx < PROGRESS_STEPS.length - 1 && (
                    <div className={cn('flex-1 h-px transition-all duration-500', idx < currentStep ? 'bg-parmore-black' : 'bg-zinc-200')} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {order.tracking_number && (
            <p className="text-xs text-parmore-slate mt-2 flex items-center gap-1">
              <Truck className="h-3 w-3" />
              Tracking: <span className="font-mono font-medium text-parmore-black">{order.tracking_number}</span>
              <a href={`https://www.ups.com/track?tracknum=${order.tracking_number}`} target="_blank" rel="noopener noreferrer" className="ml-1 hover:text-parmore-gold transition-colors">
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          )}
        </div>
      )}

      {/* ─── Items Preview ─── */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            {order.items.slice(0, 3).map((item, i) => (
              <div
                key={i}
                className="relative h-12 w-12 rounded-sm border-2 border-white overflow-hidden bg-parmore-cream shadow-sm"
              >
                <Image
                  src={item.image_url}
                  alt={item.product_name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="h-12 w-12 rounded-sm border-2 border-white bg-zinc-100 flex items-center justify-center text-xs font-medium text-parmore-slate shadow-sm">
                +{order.items.length - 3}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-parmore-slate">
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </p>
            <p className="text-sm font-medium truncate">
              {order.items.map((i) => i.product_name).join(', ')}
            </p>
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-xs text-parmore-slate hover:text-parmore-black transition-colors ml-auto shrink-0"
          >
            {expanded ? 'Hide' : 'View'} details
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')} />
          </button>
        </div>

        {/* ─── Expanded Item List ─── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-3 border-t border-zinc-50 mt-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {canReturn && (
                      <input
                        type="checkbox"
                        checked={selectedItems.has(idx)}
                        onChange={() => toggleItem(idx)}
                        className="mt-1 h-4 w-4 rounded border-zinc-300 text-parmore-gold accent-parmore-gold cursor-pointer"
                        aria-label={`Select ${item.product_name} for return`}
                      />
                    )}
                    <div className="relative h-14 w-14 rounded-sm overflow-hidden bg-parmore-cream flex-shrink-0">
                      <Image src={item.image_url} alt={item.product_name} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.product_name}</p>
                      <p className="text-xs text-parmore-slate">{item.color_name} · {item.size} · Qty {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium shrink-0">{formatPriceRaw(item.total)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 pt-4 border-t border-zinc-100 space-y-1.5">
                {[
                  { label: 'Subtotal', value: order.subtotal },
                  { label: 'Shipping', value: order.shipping_cost, free: order.shipping_cost === 0 },
                  { label: 'Tax', value: order.tax },
                ].map(({ label, value, free }) => (
                  <div key={label} className="flex justify-between text-xs text-parmore-slate">
                    <span>{label}</span>
                    <span>{free ? 'Free' : formatPriceRaw(value)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-1 border-t border-zinc-100">
                  <span>Total</span>
                  <span>{formatPriceRaw(order.total)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Action Footer ─── */}
      <div className="px-5 py-3 bg-zinc-50/40 border-t border-zinc-100 flex flex-wrap gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-parmore-slate hover:text-parmore-black"
          onClick={() => onOpenTicket?.(order)}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Get Help
        </Button>

        {canReturn && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              onOpenReturnModal?.(
                order,
                selectedItems.size > 0 ? [...selectedItems][0] : undefined
              )
            }
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {selectedItems.size > 0
              ? `Return ${selectedItems.size} Item${selectedItems.size > 1 ? 's' : ''}`
              : 'Start Return'}
          </Button>
        )}
      </div>
    </motion.article>
  );
}
