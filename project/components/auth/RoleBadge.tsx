import React from 'react';
import { cn } from '@/app/lib/utils';
import { ROLE_CONFIG, type UserRole } from '@/lib/auth/authHelpers';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold tracking-wide',
        config.bg,
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}
