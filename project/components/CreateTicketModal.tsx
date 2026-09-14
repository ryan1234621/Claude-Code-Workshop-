'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquarePlus, ChevronDown, AlertCircle, Package, RotateCcw } from 'lucide-react';
import type { Order, TicketCategory, ReturnReason } from '@/app/lib/types';
import { Button } from './ui/Button';
import { ticketCategoryLabel } from '@/app/lib/utils';
import { cn } from '@/app/lib/utils';

const CATEGORIES: TicketCategory[] = [
  'order_issue', 'return_request', 'exchange', 'product_question', 'shipping', 'billing', 'other',
];

const RETURN_REASONS: { value: ReturnReason; label: string }[] = [
  { value: 'wrong_size',       label: 'Wrong size ordered' },
  { value: 'wrong_item',       label: 'Received wrong item' },
  { value: 'defective',        label: 'Item is defective / damaged' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'changed_mind',     label: 'Changed my mind' },
  { value: 'other',            label: 'Other reason' },
];

interface CreateTicketPayload {
  subject: string;
  category: TicketCategory;
  order_id?: string;
  message: string;
  return_reason?: ReturnReason;
  return_item_indices?: number[];
}

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTicketPayload) => Promise<void>;
  prefilledOrder?: Order;
  prefilledItemIndex?: number;
  mode?: 'ticket' | 'return';
}

export function CreateTicketModal({
  isOpen,
  onClose,
  onSubmit,
  prefilledOrder,
  prefilledItemIndex,
  mode = 'ticket',
}: CreateTicketModalProps) {
  const isReturn = mode === 'return';

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>(isReturn ? 'return_request' : 'other');
  const [message, setMessage] = useState('');
  const [returnReason, setReturnReason] = useState<ReturnReason>('wrong_size');
  const [selectedItemIndices, setSelectedItemIndices] = useState<Set<number>>(
    prefilledItemIndex !== undefined ? new Set([prefilledItemIndex]) : new Set()
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // Pre-fill subject when order is attached
  useEffect(() => {
    if (!prefilledOrder) return;
    if (isReturn) {
      setSubject(`Return request — Order ${prefilledOrder.order_number}`);
      setCategory('return_request');
    } else {
      setSubject(`Issue with Order ${prefilledOrder.order_number}`);
    }
  }, [prefilledOrder, isReturn]);

  // Reset on open/close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setErrors({});
        setSubmitting(false);
        if (!prefilledOrder) {
          setSubject('');
          setCategory('other');
          setMessage('');
        }
      }, 300);
    }
  }, [isOpen, prefilledOrder]);

  const toggleItem = (idx: number) => {
    setSelectedItemIndices((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!subject.trim()) errs.subject = 'Subject is required';
    if (!message.trim()) errs.message = 'Please describe your issue';
    if (isReturn && selectedItemIndices.size === 0 && prefilledOrder) {
      errs.items = 'Select at least one item to return';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        subject: subject.trim(),
        category,
        order_id: prefilledOrder?.id,
        message: message.trim(),
        ...(isReturn && { return_reason: returnReason, return_item_indices: [...selectedItemIndices] }),
      });
      onClose();
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={isReturn ? 'Start a return' : 'Open a support ticket'}
          >
            <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-sm shadow-2xl max-h-[90dvh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
                <div className="flex items-center gap-2">
                  {isReturn
                    ? <RotateCcw className="h-4 w-4 text-parmore-gold" strokeWidth={1.5} />
                    : <MessageSquarePlus className="h-4 w-4 text-parmore-gold" strokeWidth={1.5} />
                  }
                  <h2 className="text-sm font-semibold">
                    {isReturn ? 'Start a Return / Exchange' : 'Open a Support Ticket'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="p-1.5 rounded-sm text-parmore-slate hover:text-parmore-black hover:bg-zinc-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                {/* Form error */}
                {errors.form && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-xs rounded-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {errors.form}
                  </div>
                )}

                {/* Attached order info */}
                {prefilledOrder && (
                  <div className="flex items-center gap-2.5 p-3 bg-parmore-cream rounded-sm">
                    <Package className="h-4 w-4 text-parmore-black shrink-0" strokeWidth={1.5} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">{prefilledOrder.order_number}</p>
                      <p className="text-xs text-parmore-slate truncate">
                        {prefilledOrder.items.map((i) => i.product_name).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Item selection for returns */}
                {isReturn && prefilledOrder && (
                  <div>
                    <p className="text-xs font-semibold tracking-wider uppercase text-parmore-slate mb-2">
                      Items to Return
                    </p>
                    {errors.items && (
                      <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.items}
                      </p>
                    )}
                    <div className="space-y-2">
                      {prefilledOrder.items.map((item, idx) => (
                        <label
                          key={idx}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-colors',
                            selectedItemIndices.has(idx)
                              ? 'border-parmore-gold bg-parmore-gold/5'
                              : 'border-zinc-200 hover:border-zinc-300'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selectedItemIndices.has(idx)}
                            onChange={() => toggleItem(idx)}
                            className="h-4 w-4 accent-parmore-gold cursor-pointer"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{item.product_name}</p>
                            <p className="text-xs text-parmore-slate">{item.color_name} · {item.size}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Return reason */}
                {isReturn && (
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase text-parmore-slate mb-2">
                      Reason for Return
                    </label>
                    <div className="relative">
                      <select
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value as ReturnReason)}
                        className="w-full appearance-none h-10 pl-3 pr-9 border border-zinc-200 rounded-sm text-sm bg-white focus:outline-none focus:border-parmore-black transition-colors"
                      >
                        {RETURN_REASONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-parmore-slate pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Category (for general tickets) */}
                {!isReturn && (
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase text-parmore-slate mb-2">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as TicketCategory)}
                        className="w-full appearance-none h-10 pl-3 pr-9 border border-zinc-200 rounded-sm text-sm bg-white focus:outline-none focus:border-parmore-black transition-colors"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{ticketCategoryLabel(c)}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-parmore-slate pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase text-parmore-slate mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Briefly describe your issue…"
                    maxLength={120}
                    className={cn(
                      'w-full h-10 px-3 border rounded-sm text-sm bg-white focus:outline-none transition-colors',
                      errors.subject ? 'border-red-400 focus:border-red-500' : 'border-zinc-200 focus:border-parmore-black'
                    )}
                  />
                  {errors.subject && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.subject}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase text-parmore-slate mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      isReturn
                        ? "Tell us more about the issue and what you'd like: exchange, refund, or store credit."
                        : 'Describe your issue in detail. Include any relevant order numbers, photos, or context.'
                    }
                    rows={5}
                    maxLength={2000}
                    className={cn(
                      'w-full px-3 py-2.5 border rounded-sm text-sm bg-white resize-none focus:outline-none transition-colors',
                      errors.message ? 'border-red-400 focus:border-red-500' : 'border-zinc-200 focus:border-parmore-black'
                    )}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.message ? (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.message}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="text-2xs text-parmore-slate">{message.length}/2000</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-zinc-100 flex gap-2 shrink-0">
                <Button variant="ghost" size="md" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubmit}
                  loading={submitting}
                  className="flex-1"
                >
                  {isReturn ? 'Submit Return Request' : 'Open Ticket'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
