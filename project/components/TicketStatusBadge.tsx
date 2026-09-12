'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { TicketStatus } from '@/app/lib/types';
import { ticketStatusConfig } from '@/app/lib/utils';
import { cn } from '@/app/lib/utils';

interface TicketStatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md';
  animate?: boolean;
  className?: string;
}

export function TicketStatusBadge({
  status,
  size = 'md',
  animate = true,
  className,
}: TicketStatusBadgeProps) {
  const config = ticketStatusConfig(status);
  const isPulsing = status === 'open' || status === 'in_review';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bg,
        config.text,
        size === 'sm' ? 'px-2 py-0.5 text-2xs' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      {/* Dot indicator */}
      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
        {isPulsing && animate && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              config.dot
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', config.dot)} />
      </span>
      {config.label}
    </span>
  );
}

// ─── Animated status transition wrapper ──────────────────────────────────────

interface StatusTransitionProps {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

export function AnimatedTicketStatus({ status, size = 'md' }: StatusTransitionProps) {
  return (
    <motion.div
      key={status}
      initial={{ opacity: 0, scale: 0.9, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <TicketStatusBadge status={status} size={size} />
    </motion.div>
  );
}

// ─── Status step progress bar ─────────────────────────────────────────────────

const STATUS_STEPS: TicketStatus[] = ['open', 'in_review', 'actioned', 'resolved', 'closed'];

export function TicketStatusProgress({ currentStatus }: { currentStatus: TicketStatus }) {
  const currentIndex = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1">
      {STATUS_STEPS.map((step, idx) => {
        const config = ticketStatusConfig(step);
        const done = idx <= currentIndex;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div
                className={cn(
                  'h-2 w-2 rounded-full transition-all duration-300',
                  done ? config.dot : 'bg-zinc-200'
                )}
              />
              <span className={cn('text-2xs hidden sm:block truncate', done ? config.text : 'text-zinc-400')}>
                {config.label}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-px transition-all duration-500',
                  idx < currentIndex ? 'bg-zinc-400' : 'bg-zinc-200'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
