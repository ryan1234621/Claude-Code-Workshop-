'use client';

import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  onChange?: (value: string) => void;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, label, error, className, onChange, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold tracking-wider uppercase text-parmore-slate">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
              'w-full appearance-none bg-white border border-zinc-200 rounded-sm',
              'h-10 pl-3 pr-9 text-sm text-parmore-black',
              'transition-colors duration-200',
              'hover:border-parmore-black focus:outline-none focus:border-parmore-black',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              error && 'border-red-500 focus:border-red-500',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-parmore-slate pointer-events-none"
            strokeWidth={2}
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
