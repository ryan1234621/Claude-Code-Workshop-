import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Product, Cart, CartItem } from './types';

// ─── Tailwind Class Merging ───────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency Formatting ─────────────────────────────────────────────────────

export function formatPrice(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatPriceRaw(dollars: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export function discountPercent(original: number, sale: number): number {
  return Math.round(((original - sale) / original) * 100);
}

// ─── Date Formatting ─────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];
  for (const [sec, label] of intervals) {
    const count = Math.floor(seconds / sec);
    if (count >= 1) return `${count} ${label}${count !== 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

// ─── Slug & String Helpers ───────────────────────────────────────────────────

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}…` : str;
}

// ─── Product Helpers ─────────────────────────────────────────────────────────

export function getProductBadge(product: Product): string | null {
  if (product.new_arrival) return 'New';
  if (product.best_seller) return 'Best Seller';
  if (product.compare_at_price && product.compare_at_price > product.price) {
    return `${discountPercent(product.compare_at_price, product.price)}% Off`;
  }
  return null;
}

export function isOnSale(product: Product): boolean {
  return !!(product.compare_at_price && product.compare_at_price > product.price);
}

export function getAvailableSizes(product: Product, colorName: string): string[] {
  const variant = product.variants.find((v) => v.color.name === colorName);
  if (!variant) return [];
  return variant.sizes.filter((s) => s.stock > 0).map((s) => s.label);
}

export function getAvailableColors(product: Product): { name: string; hex: string }[] {
  return product.variants.map((v) => ({ name: v.color.name, hex: v.color.hex }));
}

export function getTotalStock(product: Product): number {
  return product.variants.reduce(
    (acc, v) => acc + v.sizes.reduce((a, s) => a + s.stock, 0),
    0
  );
}

export function isInStock(product: Product): boolean {
  return getTotalStock(product) > 0;
}

// ─── Cart Helpers ─────────────────────────────────────────────────────────────

export function calcCartTotals(items: CartItem[]): Pick<Cart, 'subtotal' | 'item_count'> {
  const subtotal = items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
  const item_count = items.reduce((acc, item) => acc + item.quantity, 0);
  return { subtotal, item_count };
}

export function freeShippingRemaining(subtotal: number, threshold = 150): number {
  return Math.max(0, threshold - subtotal);
}

// ─── Array Helpers ────────────────────────────────────────────────────────────

export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ─── Image Helpers ────────────────────────────────────────────────────────────

export function getProductImageSrc(path: string): string {
  if (path.startsWith('http')) return path;
  return `/images/products/${path}`;
}

// ─── Order Helpers ────────────────────────────────────────────────────────────

export function orderStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-800';
}

// ─── Rating Helpers ───────────────────────────────────────────────────────────

export function ratingToStars(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}

// ─── Ticket Helpers (Part 2) ──────────────────────────────────────────────────

import type { TicketStatus, ReturnStatus, TicketCategory } from './types';

export function ticketStatusConfig(status: TicketStatus): {
  label: string;
  bg: string;
  text: string;
  dot: string;
} {
  const map: Record<TicketStatus, { label: string; bg: string; text: string; dot: string }> = {
    open:      { label: 'Open',      bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500' },
    in_review: { label: 'In Review', bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500' },
    actioned:  { label: 'Actioned',  bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
    resolved:  { label: 'Resolved',  bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
    closed:    { label: 'Closed',    bg: 'bg-zinc-100',  text: 'text-zinc-500',   dot: 'bg-zinc-400' },
  };
  return map[status];
}

export function returnStatusConfig(status: ReturnStatus): {
  label: string;
  bg: string;
  text: string;
} {
  const map: Record<ReturnStatus, { label: string; bg: string; text: string }> = {
    requested:   { label: 'Requested',   bg: 'bg-yellow-50', text: 'text-yellow-700' },
    approved:    { label: 'Approved',    bg: 'bg-blue-50',   text: 'text-blue-700' },
    rejected:    { label: 'Rejected',    bg: 'bg-red-50',    text: 'text-red-700' },
    shipped_back:{ label: 'Shipped Back',bg: 'bg-indigo-50', text: 'text-indigo-700' },
    received:    { label: 'Received',    bg: 'bg-purple-50', text: 'text-purple-700' },
    refunded:    { label: 'Refunded',    bg: 'bg-green-50',  text: 'text-green-700' },
  };
  return map[status];
}

export function ticketCategoryLabel(cat: TicketCategory): string {
  const map: Record<TicketCategory, string> = {
    order_issue:      'Order Issue',
    return_request:   'Return / Exchange',
    exchange:         'Exchange',
    product_question: 'Product Question',
    shipping:         'Shipping',
    billing:          'Billing',
    other:            'Other',
  };
  return map[cat] ?? cat;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
