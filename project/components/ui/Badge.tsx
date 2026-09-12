import React from 'react';
import { cn } from '@/app/lib/utils';

type BadgeVariant = 'default' | 'new' | 'sale' | 'bestseller' | 'gold' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  default:    'bg-parmore-black text-white',
  new:        'bg-parmore-navy text-white',
  sale:       'bg-red-600 text-white',
  bestseller: 'bg-parmore-gold text-parmore-black',
  gold:       'bg-parmore-gold text-parmore-black',
  outline:    'border border-current text-parmore-black bg-transparent',
};

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5',
        'text-2xs font-semibold tracking-widest uppercase',
        'rounded-sm whitespace-nowrap',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
