'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/app/lib/utils';

export interface Step {
  id: number;
  label: string;
}

interface ProgressStepsProps {
  steps: Step[];
  current: number; // 1-indexed
  className?: string;
}

export function ProgressSteps({ steps, current, className }: ProgressStepsProps) {
  return (
    <nav
      aria-label="Progress"
      className={cn('flex items-center gap-0', className)}
    >
      {steps.map((step, idx) => {
        const done = step.id < current;
        const active = step.id === current;
        const last = idx === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <motion.div
                initial={false}
                animate={
                  done
                    ? { backgroundColor: '#0a0a0a', scale: 1 }
                    : active
                    ? { backgroundColor: '#c9a84c', scale: 1.1 }
                    : { backgroundColor: '#e4e4e7', scale: 1 }
                }
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold',
                  done ? 'text-white' : active ? 'text-parmore-black' : 'text-zinc-400'
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  step.id
                )}
              </motion.div>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap hidden sm:block',
                  active ? 'text-parmore-black' : done ? 'text-parmore-slate' : 'text-zinc-400'
                )}
              >
                {step.label}
              </span>
            </div>

            {!last && (
              <div className="flex-1 mx-2 h-px bg-zinc-200 relative overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ scaleX: done ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  style={{ transformOrigin: 'left' }}
                  className="absolute inset-0 bg-parmore-black"
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
