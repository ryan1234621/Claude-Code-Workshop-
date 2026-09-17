'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  RotateCcw, Plus, Package, ChevronRight, Clock, ArrowRight,
  CheckCircle2, Truck, AlertCircle,
} from 'lucide-react';
import { MOCK_RETURNS, MOCK_ORDERS } from '@/app/lib/mockData';
import { returnStatusConfig, formatDate } from '@/app/lib/utils';
import { getReturnReasonLabel } from '@/app/lib/returns/returnPolicy';
import { riskTierConfig, type RiskTier } from '@/app/lib/returns/riskScoring';
import { Button } from '@/components/ui/Button';
import { cn } from '@/app/lib/utils';
import type { ReturnStatus } from '@/app/lib/types';

const STATUS_TIMELINE: { status: ReturnStatus; label: string; icon: React.ElementType }[] = [
  { status: 'requested',    label: 'Requested',    icon: Clock },
  { status: 'approved',     label: 'Approved',     icon: CheckCircle2 },
  { status: 'shipped_back', label: 'Shipped Back', icon: Truck },
  { status: 'received',     label: 'Received',     icon: Package },
  { status: 'refunded',     label: 'Refunded',     icon: CheckCircle2 },
];

const STATUS_ORDER: ReturnStatus[] = [
  'requested', 'approved', 'shipped_back', 'received', 'refunded',
];

// Enriched with order data for display
const returnsWithOrders = MOCK_RETURNS.map((ret) => ({
  ...ret,
  order: MOCK_ORDERS.find((o) => o.id === ret.order_id),
}));

export default function ReturnsPage() {
  const [filter, setFilter] = useState<ReturnStatus | 'all'>('all');

  const filtered = returnsWithOrders.filter(
    (r) => filter === 'all' || r.status === filter
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-bold">Returns & Exchanges</h1>
          <p className="text-sm text-parmore-slate mt-1">
            {MOCK_RETURNS.length} return{MOCK_RETURNS.length !== 1 ? 's' : ''} on record
          </p>
        </div>
        <Link href="/account/returns/new">
          <Button variant="gold" size="md">
            <Plus className="h-4 w-4" />
            New Return
          </Button>
        </Link>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        {([
          { value: 'all', label: 'All' },
          { value: 'requested', label: 'Pending Review' },
          { value: 'approved', label: 'Approved' },
          { value: 'shipped_back', label: 'In Transit' },
          { value: 'received', label: 'Received' },
          { value: 'refunded', label: 'Refunded' },
        ] as { value: ReturnStatus | 'all'; label: string }[]).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              filter === value
                ? 'bg-parmore-black text-white'
                : 'bg-white border border-zinc-200 text-parmore-slate hover:border-parmore-black hover:text-parmore-black'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-sm border border-zinc-100">
          <RotateCcw className="h-10 w-10 text-zinc-300 mx-auto mb-4" strokeWidth={1} />
          <p className="font-serif text-lg font-bold mb-1">No returns found</p>
          <p className="text-sm text-parmore-slate mb-6">
            {filter !== 'all'
              ? 'No returns with this status.'
              : "You haven't initiated any returns yet."}
          </p>
          <Link href="/account/returns/new">
            <Button variant="outline" size="md">Start a Return</Button>
          </Link>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
          className="space-y-4"
        >
          {filtered.map((ret) => {
            const statusConf = returnStatusConfig(ret.status);
            const currentIdx = STATUS_ORDER.indexOf(ret.status);
            const isRejected = ret.status === 'rejected';

            return (
              <motion.div
                key={ret.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
                }}
                className="bg-white border border-zinc-200 rounded-sm overflow-hidden"
              >
                {/* Header */}
                <div className="px-5 py-4 flex items-start justify-between gap-3 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-sm bg-parmore-cream flex items-center justify-center shrink-0">
                      <RotateCcw className="h-4 w-4 text-parmore-black" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold font-mono">{ret.return_number}</p>
                      {ret.order && (
                        <p className="text-xs text-parmore-slate">
                          Order {ret.order.order_number} · {formatDate(ret.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-semibold shrink-0',
                      statusConf.bg,
                      statusConf.text
                    )}
                  >
                    {statusConf.label}
                  </div>
                </div>

                {/* Items summary */}
                <div className="px-5 py-3 space-y-1">
                  {ret.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>
                        <span className="font-medium">{item.product_name}</span>
                        <span className="text-parmore-slate text-xs ml-2">
                          {item.color_name} · {item.size}
                        </span>
                      </span>
                      <span className="text-parmore-slate text-xs">
                        ${(item.unit_price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <p className="text-xs text-parmore-slate pt-1">
                    Reason: {getReturnReasonLabel(ret.reason)}
                  </p>
                </div>

                {/* Progress timeline (not for rejected) */}
                {!isRejected && (
                  <div className="px-5 pb-4">
                    <div className="flex items-center gap-0 mt-3">
                      {STATUS_TIMELINE.filter((s) => s.status !== 'rejected').map((step, i, arr) => {
                        const stepIdx = STATUS_ORDER.indexOf(step.status);
                        const done = stepIdx < currentIdx;
                        const active = stepIdx === currentIdx;
                        const last = i === arr.length - 1;
                        const Icon = step.icon;

                        return (
                          <React.Fragment key={step.status}>
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <div
                                className={cn(
                                  'h-6 w-6 rounded-full flex items-center justify-center transition-colors',
                                  done
                                    ? 'bg-parmore-black text-white'
                                    : active
                                    ? 'bg-parmore-gold text-parmore-black'
                                    : 'bg-zinc-100 text-zinc-400'
                                )}
                              >
                                <Icon className="h-3 w-3" strokeWidth={2} />
                              </div>
                              <span
                                className={cn(
                                  'text-[9px] font-medium hidden sm:block whitespace-nowrap',
                                  active ? 'text-parmore-black' : 'text-zinc-400'
                                )}
                              >
                                {step.label}
                              </span>
                            </div>
                            {!last && (
                              <div className="flex-1 mx-1 h-px relative overflow-hidden bg-zinc-200">
                                <div
                                  className="absolute inset-0 bg-parmore-black transition-transform duration-500"
                                  style={{
                                    transform: done ? 'scaleX(1)' : 'scaleX(0)',
                                    transformOrigin: 'left',
                                  }}
                                />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rejected state */}
                {isRejected && (
                  <div className="mx-5 mb-4 flex items-center gap-2 p-3 bg-red-50 rounded-sm">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" strokeWidth={1.5} />
                    <p className="text-xs text-red-600">
                      This return was not approved. Contact support if you believe this is an error.
                    </p>
                  </div>
                )}

                {/* Refund amount */}
                {ret.refund_amount != null && ret.status === 'refunded' && (
                  <div className="mx-5 mb-4 flex items-center justify-between p-3 bg-green-50 rounded-sm text-sm">
                    <span className="text-green-700 font-medium">Refund issued</span>
                    <span className="font-bold text-green-700">${ret.refund_amount.toFixed(2)}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Policy callout */}
      <div className="mt-8 p-4 bg-parmore-cream rounded-sm flex items-start gap-3">
        <RotateCcw className="h-4 w-4 text-parmore-black mt-0.5 shrink-0" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-semibold">30-Day Return Policy</p>
          <p className="text-xs text-parmore-slate mt-0.5">
            Items in original condition may be returned within 30 days of purchase.
            Exchanges accepted within 60 days.{' '}
            <Link href="/shipping" className="underline hover:text-parmore-black transition-colors">
              Full policy →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
