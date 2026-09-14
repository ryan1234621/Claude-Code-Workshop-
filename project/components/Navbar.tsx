'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X, ChevronDown } from 'lucide-react';
import { useCart } from './CartProvider';
import { SearchModal } from './SearchModal';
import { cn } from '@/app/lib/utils';

const NAV_LINKS = [
  {
    label: 'Shop',
    href: '/shop',
    children: [
      { label: 'All Products', href: '/shop' },
      { label: 'Apparel', href: '/shop?category=apparel' },
      { label: 'Headwear', href: '/shop?category=headwear' },
    ],
  },
  { label: 'Collections', href: '/collections' },
  { label: 'The Club', href: '/club' },
];

export function Navbar() {
  const pathname = usePathname();
  const { cart, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cmd+K / Ctrl+K opens search modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isTransparent = isHome && !scrolled && !mobileOpen;

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isTransparent
            ? 'bg-transparent'
            : 'bg-parmore-white/95 backdrop-blur-md border-b border-zinc-100 shadow-sm'
        )}
        style={{ height: 'var(--navbar-height)' }}
      >
        <div className="container-parmore h-full flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 group">
            <span
              className={cn(
                'font-serif text-xl font-bold tracking-widest uppercase transition-colors duration-300',
                isTransparent ? 'text-white' : 'text-parmore-black'
              )}
            >
              Parmore
            </span>
            <div
              className={cn(
                'h-px w-0 group-hover:w-full transition-all duration-300',
                isTransparent ? 'bg-parmore-gold-light' : 'bg-parmore-gold'
              )}
            />
          </Link>

          {/* Desktop Nav */}
          <nav ref={dropdownRef} className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <div key={link.label} className="relative">
                {link.children ? (
                  <button
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 text-sm font-medium tracking-wide',
                      'transition-colors duration-200 rounded-sm',
                      isTransparent
                        ? 'text-white/90 hover:text-white'
                        : 'text-parmore-black hover:text-parmore-gold',
                      activeDropdown === link.label && !isTransparent && 'text-parmore-gold'
                    )}
                    onClick={() =>
                      setActiveDropdown((prev) => (prev === link.label ? null : link.label))
                    }
                  >
                    {link.label}
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 transition-transform duration-200',
                        activeDropdown === link.label && 'rotate-180'
                      )}
                    />
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    className={cn(
                      'px-3 py-2 text-sm font-medium tracking-wide',
                      'transition-colors duration-200 rounded-sm',
                      isTransparent
                        ? 'text-white/90 hover:text-white'
                        : 'text-parmore-black hover:text-parmore-gold',
                      pathname === link.href && !isTransparent && 'text-parmore-gold'
                    )}
                  >
                    {link.label}
                  </Link>
                )}

                {/* Dropdown */}
                <AnimatePresence>
                  {link.children && activeDropdown === link.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-1 min-w-[180px] bg-white rounded-sm shadow-luxury-lg border border-zinc-100 py-1 z-50"
                    >
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setActiveDropdown(null)}
                          className="block px-4 py-2.5 text-sm text-parmore-black hover:bg-parmore-cream hover:text-parmore-gold transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search (⌘K)"
              className={cn(
                'flex items-center gap-1.5 p-2 rounded-sm transition-colors duration-200',
                isTransparent
                  ? 'text-white/80 hover:text-white'
                  : 'text-parmore-black hover:text-parmore-gold'
              )}
            >
              <Search className="h-5 w-5" strokeWidth={1.5} />
              <kbd className={cn(
                'hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-2xs font-mono transition-colors',
                isTransparent
                  ? 'bg-white/10 text-white/60'
                  : 'bg-zinc-100 text-parmore-slate'
              )}>
                ⌘K
              </kbd>
            </button>

            {/* Cart */}
            <button
              onClick={openCart}
              aria-label={`Open cart — ${cart.item_count} items`}
              className={cn(
                'relative p-2 rounded-sm transition-colors duration-200',
                isTransparent
                  ? 'text-white/80 hover:text-white'
                  : 'text-parmore-black hover:text-parmore-gold'
              )}
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              <AnimatePresence>
                {cart.item_count > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-1 right-1 h-4 w-4 rounded-full bg-parmore-gold text-parmore-black text-2xs font-bold flex items-center justify-center"
                  >
                    {cart.item_count > 9 ? '9+' : cart.item_count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle mobile menu"
              className={cn(
                'md:hidden p-2 rounded-sm transition-colors duration-200',
                isTransparent
                  ? 'text-white/80 hover:text-white'
                  : 'text-parmore-black hover:text-parmore-gold'
              )}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

      </header>

      {/* Search Modal — rendered outside the sticky header to avoid z-index issues */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-parmore-white z-50 md:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                <span className="font-serif text-lg font-bold tracking-widest uppercase">Parmore</span>
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="py-4">
                {NAV_LINKS.map((link) => (
                  <div key={link.label}>
                    <Link
                      href={link.href}
                      className="block px-5 py-3 text-sm font-medium text-parmore-black hover:text-parmore-gold hover:bg-parmore-cream transition-colors"
                    >
                      {link.label}
                    </Link>
                    {link.children?.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block pl-9 pr-5 py-2.5 text-sm text-parmore-slate hover:text-parmore-gold hover:bg-parmore-cream transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-zinc-100">
                <p className="text-xs text-parmore-slate tracking-wider uppercase">
                  Free shipping on orders over $150
                </p>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
