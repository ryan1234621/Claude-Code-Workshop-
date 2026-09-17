'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Printer, QrCode, MapPin, Package, CheckCircle2, Clock } from 'lucide-react';
import type { ReturnRequest } from '@/app/lib/types';
import { returnStatusConfig } from '@/app/lib/utils';
import { riskTierConfig, type RiskTier } from '@/app/lib/returns/riskScoring';
import { Button } from '@/components/ui/Button';
import { cn } from '@/app/lib/utils';

const DROP_OFF_CARRIERS = [
  { name: 'UPS Store', locations: 'Over 5,000 drop-off locations', icon: '🟫' },
  { name: 'FedEx Office', locations: 'Over 2,200 locations', icon: '🟣' },
  { name: 'USPS Post Office', locations: 'Any post office', icon: '🦅' },
];

interface ReturnLabelViewerProps {
  returnRequest: ReturnRequest;
  riskTier?: RiskTier;
  labelUrl?: string; // null when under review
}

export function ReturnLabelViewer({
  returnRequest,
  riskTier = 'standard',
  labelUrl,
}: ReturnLabelViewerProps) {
  const statusConfig = returnStatusConfig(returnRequest.status);
  const tierConfig = riskTierConfig(riskTier);
  const isPendingReview = returnRequest.status === 'requested' && !labelUrl;

  const handlePrint = () => {
    if (labelUrl) {
      window.open(labelUrl, '_blank');
    } else {
      window.print();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-4"
    >
      {/* Status banner */}
      <div className={cn('flex items-start gap-3 p-4 rounded-sm', tierConfig.bg)}>
        <CheckCircle2
          className={cn('h-5 w-5 mt-0.5 shrink-0', tierConfig.color)}
          strokeWidth={1.5}
        />
        <div>
          <p className={cn('text-sm font-semibold', tierConfig.color)}>
            Return {isPendingReview ? 'Under Review' : 'Approved'} · {tierConfig.label}
          </p>
          <p className="text-xs text-parmore-slate mt-0.5">{tierConfig.description}</p>
        </div>
      </div>

      {/* RMA summary card */}
      <div className="border border-zinc-200 rounded-sm overflow-hidden">
        <div className="bg-parmore-black px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider font-medium">
              Return Authorization
            </p>
            <p className="text-lg font-mono font-bold text-parmore-gold mt-0.5">
              {returnRequest.return_number}
            </p>
          </div>
          <div
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-semibold',
              statusConfig.bg,
              statusConfig.text
            )}
          >
            {statusConfig.label}
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Items summary */}
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-parmore-slate mb-2">
              Items
            </p>
            {returnRequest.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1">
                <div>
                  <span className="font-medium">{item.product_name}</span>
                  <span className="text-parmore-slate text-xs ml-2">
                    {item.color_name} · {item.size}
                    {item.quantity > 1 && ` × ${item.quantity}`}
                  </span>
                </div>
                <span className="text-parmore-slate text-xs">
                  ${(item.unit_price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {returnRequest.refund_amount != null && (
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-sm font-semibold">
              <span>Expected refund</span>
              <span className="text-green-700">${returnRequest.refund_amount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Shipping label or pending state */}
      {isPendingReview ? (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-sm">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-semibold text-amber-700">Prepaid label pending review</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {"Our team will email your prepaid shipping label within 24 hours once your return is verified."}
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-zinc-200 rounded-sm overflow-hidden">
          {/* Mock label */}
          <div className="p-5 bg-white print:p-0">
            <div className="border-2 border-parmore-black rounded-sm p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-base font-serif not-italic">PARMORE</span>
                <div className="flex items-center gap-1 text-parmore-slate">
                  <QrCode className="h-4 w-4" />
                  <span className="text-[10px]">SCAN AT DROP-OFF</span>
                </div>
              </div>
              <div className="border-t border-zinc-200 pt-2">
                <p className="text-parmore-slate">FROM:</p>
                <p className="font-bold">{returnRequest.return_number}</p>
              </div>
              <div className="border-t border-zinc-200 pt-2">
                <p className="text-parmore-slate">TO:</p>
                <p className="font-bold">Parmore Returns Center</p>
                <p>8800 E Chaparral Rd</p>
                <p>Scottsdale, AZ 85250</p>
              </div>
              <div className="border-t border-zinc-200 pt-2 flex items-center justify-between">
                <div>
                  <p className="text-parmore-slate">CARRIER</p>
                  <p className="font-bold">UPS GROUND</p>
                </div>
                {returnRequest.tracking_number && (
                  <div className="text-right">
                    <p className="text-parmore-slate">TRACKING</p>
                    <p className="font-bold text-[10px]">{returnRequest.tracking_number}</p>
                  </div>
                )}
              </div>
              {/* Barcode mock */}
              <div className="pt-1 flex gap-px h-10">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-parmore-black"
                    style={{ opacity: Math.random() > 0.4 ? 1 : 0 }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 pb-4">
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handlePrint}
              className="mt-3"
            >
              <Printer className="h-4 w-4" />
              Print Return Label
            </Button>
          </div>
        </div>
      )}

      {/* Drop-off locations */}
      {!isPendingReview && (
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-parmore-slate mb-3 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Drop-off Options
          </p>
          <div className="space-y-2">
            {DROP_OFF_CARRIERS.map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-3 p-3 border border-zinc-200 rounded-sm"
              >
                <span className="text-xl shrink-0">{c.icon}</span>
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-parmore-slate">{c.locations}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-parmore-slate text-center">
        Questions? Visit{' '}
        <a href="/account/tickets" className="underline hover:text-parmore-black transition-colors">
          your support tickets
        </a>{' '}
        or email returns@parmore.com
      </p>
    </motion.div>
  );
}
