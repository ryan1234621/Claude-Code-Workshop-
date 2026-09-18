'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShoppingBag, RotateCcw, LifeBuoy, Settings, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react';
import { RoleBadge } from './RoleBadge';
import { getUserRole, signOut, isAdmin } from '@/lib/auth/authHelpers';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { cn } from '@/app/lib/utils';

interface UserMenuDropdownProps {
  user: SupabaseUser;
}

export function UserMenuDropdown({ user }: UserMenuDropdownProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const role = getUserRole(user);
  const meta = user.user_metadata as Record<string, string>;
  const displayName = meta?.full_name ?? user.email?.split('@')[0] ?? 'Member';
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  const customerLinks = [
    { href: '/account', label: 'My Account', icon: User },
    { href: '/account/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/account/returns', label: 'Returns', icon: RotateCcw },
    { href: '/account/tickets', label: 'Support', icon: LifeBuoy },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: ShoppingBag },
    { href: '/admin/tickets', label: 'Tickets', icon: LifeBuoy },
  ];

  const links = isAdmin(user) ? adminLinks : customerLinks;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open account menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 p-1 rounded-sm transition-colors hover:bg-zinc-100"
      >
        <div className="h-8 w-8 rounded-full bg-parmore-black text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
          {initials}
        </div>
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-parmore-slate transition-transform', open && 'rotate-180')}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-white border border-zinc-100 rounded-sm shadow-luxury-lg z-50 overflow-hidden"
          >
            {/* User identity */}
            <div className="px-4 py-3 border-b border-zinc-100">
              <p className="text-xs font-semibold text-parmore-black truncate">{displayName}</p>
              <p className="text-2xs text-parmore-slate truncate mt-0.5">{user.email}</p>
              <div className="mt-2">
                <RoleBadge role={role} />
              </div>
            </div>

            {/* Nav links */}
            <div className="py-1">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-parmore-black hover:bg-parmore-cream hover:text-parmore-gold transition-colors"
                >
                  <Icon className="h-4 w-4 text-parmore-slate flex-shrink-0" strokeWidth={1.5} />
                  {label}
                </Link>
              ))}
            </div>

            {/* Settings & sign out */}
            <div className="py-1 border-t border-zinc-100">
              <Link
                href="/account/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-parmore-black hover:bg-parmore-cream hover:text-parmore-gold transition-colors"
              >
                <Settings className="h-4 w-4 text-parmore-slate flex-shrink-0" strokeWidth={1.5} />
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <LogOut className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
