import React from 'react';
import type { Metadata } from 'next';
import { SettingsForm } from '@/components/SettingsForm';
import { MOCK_USER, MOCK_ORDERS } from '@/app/lib/mockData';
import { formatDate, formatPriceRaw } from '@/app/lib/utils';
import Link from 'next/link';
import { Package, MessageSquare, ArrowRight } from 'lucide-react';

export const metadata: Metadata = { title: 'Profile & Settings' };

// ─── Quick Stats ─────────────────────────────────────────────────────────────

function QuickStats() {
  const totalSpent = MOCK_ORDERS.reduce((acc, o) => acc + o.total, 0);

  const stats = [
    { label: 'Total Orders', value: MOCK_ORDERS.length, href: '/account/orders', icon: Package },
    { label: 'Lifetime Spend', value: formatPriceRaw(totalSpent), href: '/account/orders', icon: null },
    { label: 'Support Tickets', value: 3, href: '/account/tickets', icon: MessageSquare },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      {stats.map(({ label, value, href, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          className="bg-white rounded-sm border border-zinc-100 shadow-luxury p-4 hover:border-parmore-gold/40 hover:shadow-luxury-lg transition-all group"
        >
          <p className="text-xs text-parmore-slate mb-1">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
          <ArrowRight className="h-3.5 w-3.5 text-parmore-slate group-hover:text-parmore-gold mt-2 transition-colors" />
        </Link>
      ))}
    </div>
  );
}

// ─── Recent Orders Preview ────────────────────────────────────────────────────

function RecentOrders() {
  const recent = MOCK_ORDERS.slice(0, 2);

  return (
    <div className="bg-white rounded-sm border border-zinc-100 shadow-luxury mb-8">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Recent Orders</h2>
        <Link href="/account/orders" className="text-xs text-parmore-gold hover:underline">View all</Link>
      </div>
      <ul className="divide-y divide-zinc-50">
        {recent.map((order) => (
          <li key={order.id} className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{order.order_number}</p>
              <p className="text-xs text-parmore-slate mt-0.5">{formatDate(order.created_at)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{formatPriceRaw(order.total)}</p>
              <p className="text-xs text-parmore-slate capitalize mt-0.5">{order.status.replace('_', ' ')}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-serif font-bold">Profile & Settings</h1>
        <p className="text-sm text-parmore-slate mt-1">
          Member since {formatDate(MOCK_USER.created_at)}
        </p>
      </div>

      <QuickStats />
      <RecentOrders />

      <SettingsForm
        initialProfile={{
          full_name: MOCK_USER.full_name,
          email: MOCK_USER.email,
          phone: MOCK_USER.phone,
        }}
        initialAddress={{
          full_name: MOCK_USER.full_name,
          line1: '42 Augusta Way',
          line2: '',
          city: 'Scottsdale',
          state: 'AZ',
          zip: '85251',
          country: 'US',
        }}
        onSaveProfile={async (data) => {
          // In production: call updateProfile(MOCK_USER.id, data)
          await new Promise((r) => setTimeout(r, 800));
          console.log('Profile saved', data);
        }}
        onSaveAddress={async (data) => {
          await new Promise((r) => setTimeout(r, 800));
          console.log('Address saved', data);
        }}
      />
    </div>
  );
}
