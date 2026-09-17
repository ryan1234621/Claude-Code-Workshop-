'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronDown, Package, AlertCircle, RotateCcw, Info,
} from 'lucide-react';
import { MOCK_ORDERS, MOCK_USER } from '@/app/lib/mockData';
import { checkReturnEligibility, requiresPhotoProof, canOfferInstantExchange } from '@/app/lib/returns/returnPolicy';
import { riskTierConfig } from '@/app/lib/returns/riskScoring';
import { formatDate, formatPriceRaw, returnStatusConfig } from '@/app/lib/utils';
import { ProgressSteps, type Step } from '@/components/ui/ProgressSteps';
import { ReturnItemSelector, type SelectedItem } from '@/components/returns/ReturnItemSelector';
import { InstantExchangeOffer, type ExchangeChoice } from '@/components/returns/InstantExchangeOffer';
import { PhotoProofUploader, type UploadedProof } from '@/components/returns/PhotoProofUploader';
import { ReturnLabelViewer } from '@/components/returns/ReturnLabelViewer';
import { Button } from '@/components/ui/Button';
import { cn } from '@/app/lib/utils';
import type { Order, ReturnReason, ReturnRequest, ReturnStatus } from '@/app/lib/types';

const STEPS: Step[] = [
  { id: 1, label: 'Select Items' },
  { id: 2, label: 'Review & Photos' },
  { id: 3, label: 'Confirmation' },
];

type SubmitResult = {
  returnNumber: string;
  rmaId: string;
  status: ReturnStatus;
  riskTier: 'low' | 'standard' | 'high';
  autoApprove: boolean;
  requiresReview: boolean;
  labelIssued: boolean;
  eligibility: { daysRemaining: number; canExchange: boolean };
};

export default function NewReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledOrderId = searchParams.get('orderId');

  // ─── Step 1 state ─────────────────────────────────────────────────────────
  const [selectedOrderId, setSelectedOrderId] = useState(prefilledOrderId ?? '');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [notes, setNotes] = useState('');
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // ─── Step 2 state ─────────────────────────────────────────────────────────
  const [showExchangeOffer, setShowExchangeOffer] = useState(false);
  const [exchangeChoices, setExchangeChoices] = useState<ExchangeChoice[]>([]);
  const [isExchange, setIsExchange] = useState(false);
  const [proofs, setProofs] = useState<UploadedProof[]>([]);
  const [tempRmaId] = useState(() => `tmp-${Date.now()}`); // used as storage folder until RMA is created
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  // ─── Submission state ──────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── Step navigation ──────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const order = MOCK_ORDERS.find((o) => o.id === selectedOrderId);
  const eligibilityResult = order ? checkReturnEligibility(order) : null;
  const returnValue = selectedItems.reduce(
    (sum, s) => sum + s.item.unit_price * s.quantity,
    0
  );
  // Whether any selected item needs photo proof
  const needsPhoto = selectedItems.some((s) => requiresPhotoProof(s.reason));
  // Whether instant exchange can be offered
  const canExchange =
    eligibilityResult?.eligible &&
    selectedItems.length > 0 &&
    selectedItems.every((s) => canOfferInstantExchange(s.reason, eligibilityResult.daysRemaining));

  // Eligible orders for the dropdown
  const eligibleOrders = MOCK_ORDERS.filter((o) => {
    const elig = checkReturnEligibility(o);
    return elig.eligible;
  });

  // ─── Step 1 validation ────────────────────────────────────────────────────
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!selectedOrderId) errs.order = 'Select an order to continue';
    if (selectedItems.length === 0) errs.items = 'Select at least one item to return';
    if (eligibilityResult && !eligibilityResult.eligible) {
      errs.order = (eligibilityResult as { eligible: false; reason: string }).reason;
    }
    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Step 2 validation ────────────────────────────────────────────────────
  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (needsPhoto && proofs.length === 0) {
      errs.photos = 'At least one photo is required for this return reason';
    }
    setStep2Errors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Exchange flow ────────────────────────────────────────────────────────
  const handleNextFromStep1 = () => {
    if (!validateStep1()) return;
    if (canExchange && !isExchange && !showExchangeOffer) {
      setShowExchangeOffer(true);
      return;
    }
    setShowExchangeOffer(false);
    setStep(2);
  };

  const handleAcceptExchange = (choices: ExchangeChoice[]) => {
    setExchangeChoices(choices);
    setIsExchange(true);
    setShowExchangeOffer(false);
    setStep(2);
  };

  const handleDeclineExchange = () => {
    setIsExchange(false);
    setShowExchangeOffer(false);
    setStep(2);
  };

  // ─── Submission ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep2()) return;
    if (!order) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/returns/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          userId: MOCK_USER.id,
          items: selectedItems.map((s) => ({
            order_item_index: s.index,
            product_name: s.item.product_name,
            color_name: s.item.color_name,
            size: s.item.size,
            quantity: s.quantity,
            unit_price: s.item.unit_price,
          })),
          reason: selectedItems[0]?.reason ?? 'other',
          notes: notes.trim() || undefined,
          photoProofPaths: proofs.map((p) => p.path),
          riskSignals: {
            totalOrders: MOCK_ORDERS.length,
            totalReturns: 0,
            accountAgeDays: 365,
          },
          exchangeChoices: isExchange ? exchangeChoices : [],
          isExchange,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? 'Submission failed. Please try again.');
        return;
      }

      setSubmitResult(data as SubmitResult);
      setStep(3);
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Mock return request for the label viewer (built from submission result)
  const mockRmaForViewer: ReturnRequest | null = submitResult
    ? {
        id: submitResult.rmaId,
        return_number: submitResult.returnNumber,
        user_id: MOCK_USER.id,
        order_id: order?.id ?? '',
        items: selectedItems.map((s) => ({
          order_item_index: s.index,
          product_name: s.item.product_name,
          color_name: s.item.color_name,
          size: s.item.size,
          quantity: s.quantity,
          unit_price: s.item.unit_price,
        })),
        reason: selectedItems[0]?.reason ?? 'other',
        notes,
        status: submitResult.status,
        refund_amount: returnValue,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : null;

  return (
    <div className="max-w-xl">
      {/* Back link */}
      <Link
        href="/account/returns"
        className="inline-flex items-center gap-1.5 text-sm text-parmore-slate hover:text-parmore-black transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Returns
      </Link>

      {/* Progress */}
      <div className="mb-8">
        <h1 className="text-xl font-serif font-bold mb-5">
          {isExchange ? 'Start an Exchange' : 'Start a Return'}
        </h1>
        <ProgressSteps steps={STEPS} current={step} />
      </div>

      <AnimatePresence mode="wait">
        {/* ── STEP 1: Select Items ─────────────────────────────────────────── */}
        {step === 1 && !showExchangeOffer && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Order picker */}
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-parmore-slate mb-2">
                Order
              </label>
              {step1Errors.order && (
                <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {step1Errors.order}
                </p>
              )}
              <div className="relative">
                <select
                  value={selectedOrderId}
                  onChange={(e) => {
                    setSelectedOrderId(e.target.value);
                    setSelectedItems([]);
                  }}
                  className={cn(
                    'w-full appearance-none h-10 pl-3 pr-9 border rounded-sm text-sm bg-white focus:outline-none transition-colors',
                    step1Errors.order
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-zinc-200 focus:border-parmore-black'
                  )}
                >
                  <option value="">Select an order…</option>
                  {eligibleOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} · {formatDate(o.created_at)} · ${o.total.toFixed(2)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-parmore-slate pointer-events-none" />
              </div>

              {/* Eligibility hint */}
              {eligibilityResult?.eligible && (
                <p className="text-xs text-green-700 mt-1.5 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {eligibilityResult.daysRemaining} day{eligibilityResult.daysRemaining !== 1 ? 's' : ''} remaining in return window
                </p>
              )}
            </div>

            {/* Item selector */}
            {order && (
              <ReturnItemSelector
                order={order}
                selected={selectedItems}
                onChange={setSelectedItems}
                error={step1Errors.items}
              />
            )}

            {/* Notes */}
            {selectedItems.length > 0 && (
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase text-parmore-slate mb-2">
                  Additional Notes{' '}
                  <span className="normal-case font-normal text-parmore-slate/70">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any details that will help us process your return faster…"
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-sm text-sm bg-white resize-none focus:outline-none focus:border-parmore-black transition-colors"
                />
              </div>
            )}

            {/* Return value summary */}
            {selectedItems.length > 0 && (
              <div className="flex items-center justify-between text-sm p-3 bg-parmore-cream rounded-sm">
                <span className="text-parmore-slate">Estimated refund</span>
                <span className="font-bold">{formatPriceRaw(returnValue)}</span>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleNextFromStep1}
              disabled={selectedItems.length === 0 || !selectedOrderId}
            >
              Continue
            </Button>
          </motion.div>
        )}

        {/* ── EXCHANGE OFFER interstitial ───────────────────────────────────── */}
        {step === 1 && showExchangeOffer && (
          <motion.div
            key="exchange-offer"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
          >
            <InstantExchangeOffer
              items={selectedItems}
              onAccept={handleAcceptExchange}
              onDecline={handleDeclineExchange}
            />
          </motion.div>
        )}

        {/* ── STEP 2: Review & Photos ───────────────────────────────────────── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Exchange badge */}
            {isExchange && (
              <div className="flex items-center gap-2 p-3 bg-parmore-gold/10 border border-parmore-gold/30 rounded-sm">
                <RotateCcw className="h-4 w-4 text-parmore-gold shrink-0" strokeWidth={1.5} />
                <p className="text-sm font-medium text-parmore-black">
                  Instant exchange selected — replacement ships immediately on approval.
                </p>
              </div>
            )}

            {/* Review summary */}
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wider uppercase text-parmore-slate">
                Return Summary
              </p>
              {selectedItems.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 border border-zinc-200 rounded-sm"
                >
                  {s.item.image_url && (
                    <img
                      src={s.item.image_url}
                      alt={s.item.product_name}
                      className="h-12 w-12 rounded-sm object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{s.item.product_name}</p>
                    <p className="text-xs text-parmore-slate">
                      {s.item.color_name} · {s.item.size}
                      {isExchange && exchangeChoices.find((c) => c.itemIndex === s.index) && (
                        <span className="ml-1 text-parmore-gold font-medium">
                          → {exchangeChoices.find((c) => c.itemIndex === s.index)?.newSize}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-parmore-slate capitalize mt-0.5">
                      {s.reason.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold shrink-0">
                    ${(s.item.unit_price * s.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Photo proof uploader */}
            <PhotoProofUploader
              returnId={tempRmaId}
              value={proofs}
              onChange={setProofs}
              required={needsPhoto}
              error={step2Errors.photos}
            />

            {/* Global submit error */}
            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-sm text-xs text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {submitError}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setStep(1)}
                className="flex-1"
                disabled={submitting}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                loading={submitting}
                className="flex-1"
              >
                {isExchange ? 'Submit Exchange' : 'Submit Return'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Confirmation ──────────────────────────────────────────── */}
        {step === 3 && submitResult && mockRmaForViewer && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <ReturnLabelViewer
              returnRequest={mockRmaForViewer}
              riskTier={submitResult.riskTier}
              labelUrl={submitResult.labelIssued ? `/labels/${submitResult.returnNumber}.pdf` : undefined}
            />

            <div className="flex gap-2">
              <Link href="/account/returns" className="flex-1">
                <Button variant="secondary" size="md" fullWidth>
                  View All Returns
                </Button>
              </Link>
              <Link href="/account/orders" className="flex-1">
                <Button variant="ghost" size="md" fullWidth>
                  Back to Orders
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
