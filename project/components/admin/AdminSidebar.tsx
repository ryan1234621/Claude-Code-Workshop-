'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, TrendingUp, Package, MessageSquare, Users,
  Shield, LogOut, Menu, X, ChevronRight, Lock,
} from 'lucide-react';
import type { AdminUser } from '@/app/lib/permissions';
import { hasScope, ROLE_LABELS, ROLE_COLORS } from '@/app/lib/permissions';
import { cn } from '@/app/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  scope?: Parameters<typeof hasScope>[1];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin',           label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics',  icon: TrendingUp,     scope: 'analytics:read' },
  { href: '/admin/products',  label: 'Products',   icon: Package,        scope: 'products:read' },
  { href: '/admin/tickets',   label: 'Support',    icon: MessageSquare,  scope: 'tickets:read' },
  { href: '/admin/team',      label: 'Team',       icon: Users,          scope: 'team:read' },
];

interface AdminSidebarProps {
  admin: AdminUser;
}

function NavLink({ item, admin, isActive }: { item: NavItem; admin: AdminUser; isActive: boolean }) {
  const locked = item.scope && !hasScope(admin, item.scope);
  const Icon = item.icon;

  if (locked) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-zinc-400 cursor-not-allowed select-none">
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        <span className="text-sm">{item.label}</span>
        <Lock className="h-3 w-3 ml-auto" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors text-sm font-medium',
        isActive
          ? 'text-parmore-black bg-parmore-cream'
          : 'text-zinc-500 hover:text-parmore-black hover:bg-zinc-50'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="admin-nav-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-parmore-gold rounded-r-full"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-parmore-black' : '')} strokeWidth={1.5} />
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto px-1.5 py-0.5 rounded-full text-2xs font-bold bg-parmore-gold text-parmore-black">
          {item.badge}
        </span>
      )}
      {isActive && <ChevronRight className="h-3 w-3 ml-auto text-parmore-gold" strokeWidth={1.5} />}
    </Link>
  );
}

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-parmore-gold" strokeWidth={1.5} />
          <span className="font-serif font-bold text-sm tracking-widest uppercase">Parmore</span>
          <span className="text-xs text-parmore-slate">Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            admin={admin}
            isActive={isActive(item.href)}
          />
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-zinc-100 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-parmore-gold flex items-center justify-center text-parmore-black text-xs font-bold shrink-0">
            {admin.avatar_initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{admin.full_name}</p>
            <span className={cn('text-2xs px-1.5 py-0.5 rounded-full font-medium', ROLE_COLORS[admin.role])}>
              {ROLE_LABELS[admin.role]}
            </span>
          </div>
        </div>
        <button className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-[var(--navbar-height)] bottom-0 w-60 bg-white border-r border-zinc-100 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-[var(--navbar-height)] left-0 right-0 z-30 bg-white border-b border-zinc-100 flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-parmore-gold" strokeWidth={1.5} />
          <span className="text-sm font-semibold">Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle admin menu"
          className="p-2 rounded-sm text-parmore-slate hover:text-parmore-black transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="mob-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/30 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="mob-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="lg:hidden fixed top-[var(--navbar-height)] left-0 bottom-0 w-72 bg-white z-50 border-r border-zinc-100"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
