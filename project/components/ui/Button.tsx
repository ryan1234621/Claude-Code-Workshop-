import React from 'react';
import { cn } from '@/app/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'gold';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  as?: 'button' | 'a';
  href?: string;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-parmore-black text-parmore-white hover:bg-zinc-800 active:bg-zinc-900',
  secondary:
    'bg-parmore-cream text-parmore-black hover:bg-stone-200 active:bg-stone-300',
  ghost:
    'bg-transparent text-parmore-black hover:bg-black/5 active:bg-black/10',
  outline:
    'border border-parmore-black bg-transparent text-parmore-black hover:bg-parmore-black hover:text-white',
  gold:
    'bg-parmore-gold text-parmore-black hover:bg-parmore-gold-light active:bg-yellow-600',
};

const sizes: Record<Size, string> = {
  sm:  'h-8  px-3  text-xs  gap-1.5',
  md:  'h-10 px-4  text-sm  gap-2',
  lg:  'h-12 px-6  text-sm  gap-2',
  xl:  'h-14 px-8  text-base gap-2.5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-medium tracking-wide',
          'transition-all duration-200 rounded-sm focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-parmore-gold focus-visible:ring-offset-1',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          // Variant
          variants[variant],
          // Size
          sizes[size],
          // Full width
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
