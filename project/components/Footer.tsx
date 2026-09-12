import React from 'react';
import Link from 'next/link';
import { Instagram, Twitter, Youtube, Mail } from 'lucide-react';

const SHOP_LINKS = [
  { label: 'All Products', href: '/shop' },
  { label: 'Apparel', href: '/shop?category=apparel' },
  { label: 'Headwear', href: '/shop?category=headwear' },
  { label: 'Collections', href: '/collections' },
  { label: 'New Arrivals', href: '/shop?filter=new' },
  { label: 'Best Sellers', href: '/shop?filter=bestsellers' },
];

const COMPANY_LINKS = [
  { label: 'Our Story', href: '/about' },
  { label: 'The Club', href: '/club' },
  { label: 'Sustainability', href: '/sustainability' },
  { label: 'Careers', href: '/careers' },
  { label: 'Press', href: '/press' },
];

const SUPPORT_LINKS = [
  { label: 'Size Guide', href: '/size-guide' },
  { label: 'Shipping & Returns', href: '/shipping' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Track Your Order', href: '/track' },
];

const SOCIALS = [
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
  { icon: Twitter, label: 'Twitter / X', href: 'https://x.com' },
  { icon: Youtube, label: 'YouTube', href: 'https://youtube.com' },
];

export function Footer() {
  return (
    <footer className="bg-parmore-black text-white">
      {/* Top band — newsletter */}
      <div className="border-b border-white/10">
        <div className="container-parmore py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <p className="label-caps text-parmore-gold mb-1">The Clubhouse</p>
            <h3 className="text-xl font-serif font-bold">Join the inner circle</h3>
            <p className="mt-1 text-sm text-white/60 max-w-xs">
              Early access to drops, members-only events, and course-side stories.
            </p>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full md:w-auto gap-2"
          >
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <div className="flex flex-1 md:w-72 border border-white/20 rounded-sm overflow-hidden focus-within:border-parmore-gold transition-colors">
              <Mail className="ml-3 self-center h-4 w-4 text-white/40 shrink-0" />
              <input
                id="footer-email"
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-parmore-gold text-parmore-black text-sm font-semibold rounded-sm hover:bg-parmore-gold-light transition-colors whitespace-nowrap"
            >
              Join Now
            </button>
          </form>
        </div>
      </div>

      {/* Main grid */}
      <div className="container-parmore py-14 grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-16">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <p className="font-serif text-xl font-bold tracking-widest uppercase mb-4">Parmore</p>
          <p className="text-sm text-white/50 leading-relaxed mb-6 max-w-[22ch]">
            Athletic luxury golf apparel — engineered for performance, finished for style.
          </p>
          <div className="flex gap-3">
            {SOCIALS.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="p-2 rounded-sm bg-white/5 hover:bg-parmore-gold hover:text-parmore-black transition-all duration-200"
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        {/* Shop */}
        <div>
          <p className="label-caps text-white/40 mb-4">Shop</p>
          <ul className="space-y-2.5">
            {SHOP_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-white/60 hover:text-parmore-gold transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <p className="label-caps text-white/40 mb-4">Company</p>
          <ul className="space-y-2.5">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-white/60 hover:text-parmore-gold transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <p className="label-caps text-white/40 mb-4">Support</p>
          <ul className="space-y-2.5">
            {SUPPORT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-white/60 hover:text-parmore-gold transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-parmore py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <p>&copy; {new Date().getFullYear()} Parmore Golf LLC. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
            <Link href="/accessibility" className="hover:text-white/60 transition-colors">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
