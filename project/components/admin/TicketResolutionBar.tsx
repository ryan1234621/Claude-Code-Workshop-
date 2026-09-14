'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, AlertCircle, DollarSign, ChevronDown, Loader2 } from 'lucide-react';
import type { SupportTicket, TicketStatus } from '@/app/lib/types';
import type { AdminUser } from '@/app/lib/permissions';
import { hasScope } from '@/app/lib/permissions';
import { ticketStatusConfig } from '@/app/lib/utils';
import { cn } from '@/app/lib/utils';

interface TicketResolutionBarProps {
  ticket: SupportTicket;
  admin: AdminUser;
  onStatusChange: (status: TicketStatus) => Promise<void>;
  onRefund?: (amount: number, reason: string) => Promise<void>;
}

interface StatusTransition {
  to: TicketStatus;
  label: string;
  icon: React.ElementType;
  variant: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

function getTransitions(current: TicketStatus): StatusTransition[] {
  const map: Partial<Record<TicketStatus, StatusTransition[]>> = {
    open: [
      { to: 'in_review', label: 'Start Review',  icon: Clock,        variant: 'primary' },
      { to: 'closed',    label: 'Close Ticket',  icon: XCircle,      variant: 'neutral' },
    ],
    in_review: [
      { to: 'actioned',  label: 'Mark Actioned', icon: AlertCircle,  variant: 'warning' },
      { to: 'resolved',  label: 'Resolve',       icon: CheckCircle,  variant: 'success' },
      { to: 'closed',    label: 'Close',         icon: XCircle,      variant: 'neutral' },
    ],
    actioned: [
      { to: 'resolved',  label: 'Mark Resolved', icon: CheckCircle,  variant: 'success' },
      { to: 'closed',    label: 'Close Ticket',  icon: XCircle,      variant: 'neutral' },
    ],
    resolved: [
      { to: 'open',      label: 'Reopen',        icon: Clock,        variant: 'primary' },
      { to: 'closed',    label: 'Close Ticket',  icon: XCircle,      variant: 'neutral' },
    ],
    closed: [
      { to: 'open',      label: 'Reopen Ticket', icon: Clock,        variant: 'primary' },
    ],
  };
  return map[current] ?? [];
}

const VARIANT_STYLES = {
  primary: 'bg-parmore-black text-white hover:bg-zinc-800',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
  danger:  'bg-red-600 text-white hover:bg-red-700',
  neutral: 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400',
};

export function TicketResolutionBar({ ticket, admin, onStatusChange, onRefund }: TicketResolutionBarProps) {
  const [pendingStatus, setPendingStatus] = useState<TicketStatus | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const transitions = getTransitions(ticket.status);
  const canResolve = hasScope(admin, 'tickets:resolve');
  const canRefund = hasScope(admin, 'tickets:refund');
  const currentCfg = ticketStatusConfig(ticket.status);

  const handleStatusChange = async (to: TicketStatus) => {
    if (to === 'closed' && !confirmClose) {
      setConfirmClose(true);
      return;
    }
    setConfirmClose(false);
    setPendingStatus(to);
    try {
      await onStatusChange(to);
    } finally {
      setPendingStatus(null);
    }
  };

  const handleRefund = async () => {
    const amount = parseFloat(refundAmount);
    if (!amount || !refundReason.trim()) return;
    setSubmittingRefund(true);
    try {
      await onRefund?.(amount, refundReason.trim());
      setShowRefundForm(false);
      setRefundAmount('');
      setRefundReason('');
    } finally {
      setSubmittingRefund(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Current status */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-parmore-slate">Status:</span>
        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', currentCfg.bg, currentCfg.text)}>
          {currentCfg.label}
        </span>
      </div>

      {/* Action buttons */}
      {canResolve && transitions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {transitions.map((t) => {
            const Icon = t.icon;
            const isLoading = pendingStatus === t.to;
            return (
              <button
                key={t.to}
                onClick={() => handleStatusChange(t.to)}
                disabled={!!pendingStatus}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors',
                  VARIANT_STYLES[t.variant],
                  !!pendingStatus && 'opacity-60 cursor-not-allowed'
                )}
              >
                {isLoading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Icon className="h-3.5 w-3.5" />
                }
                {t.to === 'closed' && confirmClose ? 'Confirm Close' : t.label}
              </button>
            );
          })}
          {confirmClose && (
            <button
              onClick={() => setConfirmClose(false)}
              className="px-3 py-1.5 rounded-sm text-xs text-parmore-slate hover:text-parmore-black transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Refund section */}
      {canRefund && (
        <div>
          <button
            onClick={() => setShowRefundForm((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-parmore-slate hover:text-parmore-black transition-colors"
          >
            <DollarSign className="h-3.5 w-3.5" />
            Issue refund
            <ChevronDown className={cn('h-3 w-3 transition-transform', showRefundForm && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {showRefundForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-3 bg-zinc-50 rounded-sm border border-zinc-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-2xs font-semibold text-parmore-slate mb-1 uppercase tracking-wider">
                        Amount (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-parmore-slate">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-6 pr-3 h-9 border border-zinc-200 rounded-sm text-sm bg-white focus:outline-none focus:border-parmore-black transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-2xs font-semibold text-parmore-slate mb-1 uppercase tracking-wider">
                        Reason
                      </label>
                      <input
                        type="text"
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        placeholder="e.g. Defective item"
                        className="w-full px-3 h-9 border border-zinc-200 rounded-sm text-sm bg-white focus:outline-none focus:border-parmore-black transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRefund}
                      disabled={!refundAmount || !refundReason.trim() || submittingRefund}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-sm text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingRefund && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Process Refund
                    </button>
                    <button
                      onClick={() => setShowRefundForm(false)}
                      className="px-3 py-1.5 text-xs text-parmore-slate hover:text-parmore-black transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Locked state */}
      {!canResolve && (
        <p className="text-xs text-zinc-400 flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 border border-zinc-300 rounded-sm inline-flex items-center justify-center text-zinc-300">🔒</span>
          You don't have permission to change ticket status.
        </p>
      )}
    </div>
  );
}
