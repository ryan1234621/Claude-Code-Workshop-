'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Package, MessageSquare, ChevronRight, LogOut } from 'lucide-react';
import { MOCK_USER } from '@/app/lib/mockData';
import { cn } from '@/app/lib/utils';

const NAV_TABS = [
  { href: '/account',         label: 'Profile',         icon: User },
  { href: '/account/orders',  label: 'Orders',          icon: Package },
  { href: '/account/tickets', label: 'Support',         icon: MessageSquare },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="pt-[var(--navbar-height)] min-h-screen bg-zinc-50">
      {/* Account header */}
      <div className="bg-parmore-black text-white">
        <div className="container-parmore py-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-parmore-gold flex items-center justify-center text-parmore-black font-bold text-lg shrink-0">
              {MOCK_USER.full_name.charAt(0)}
            </div>
            <div>
              <p className="font-serif text-lg font-bold">{MOCK_USER.full_name}</p>
              <p className="text-sm text-white/60">{MOCK_USER.email}</p>
            </div>
            <button className="ml-auto flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-white border-b border-zinc-200 sticky top-[var(--navbar-height)] z-30">
        <div className="container-parmore">
          <nav className="flex gap-0 overflow-x-auto hide-scrollbar" role="tablist">
            {NAV_TABS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/account' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  role="tab"
                  aria-selected={isActive}
                  className={cn(
                    'relative flex items-center gap-2 px-4 sm:px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'text-parmore-black'
                      : 'text-parmore-slate hover:text-parmore-black'
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  {label}
                  {isActive && (
                    <motion.div
                      layoutId="account-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-parmore-gold"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="container-parmore py-3">
        <nav className="flex items-center gap-1.5 text-xs text-parmore-slate">
          <Link href="/" className="hover:text-parmore-black transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/account" className="hover:text-parmore-black transition-colors">Account</Link>
          {pathname !== '/account' && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-parmore-black capitalize">
                {NAV_TABS.find((t) => pathname.startsWith(t.href) && t.href !== '/account')?.label}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Page content */}
      <div className="container-parmore pb-16">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
