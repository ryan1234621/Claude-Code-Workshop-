'use client';

import React from 'react';
import { redirect } from 'next/navigation';
import { ShoppingBag, DollarSign, Users, TrendingUp } from 'lucide-react';
import { MOCK_CURRENT_ADMIN, hasScope } from '@/app/lib/permissions';
import { MOCK_PRODUCTS } from '@/app/lib/mockData';
import { KpiCard, HBarChart, ChartSection } from '@/components/admin/AnalyticsChart';
import { Table } from '@/components/ui/Table';
import type { TableColumn } from '@/components/ui/Table';

// ─── Mock analytics data ──────────────────────────────────────────────────────

const REVENUE_SPARK = [42, 38, 51, 47, 60, 55, 68, 71, 65, 74, 80, 83, 78, 90, 88, 95, 102, 98, 110, 115, 108, 120, 118, 125, 130, 128, 135, 142, 138, 145];

const TOP_SEARCH_TERMS = [
  { label: 'polo shirt',       value: 312 },
  { label: 'quarter-zip',      value: 247 },
  { label: 'performance pants',value: 198 },
  { label: 'snapback hat',     value: 176 },
  { label: 'golf glove',       value: 143 },
  { label: 'stretch trouser',  value: 121 },
  { label: 'UV protection',    value: 98  },
  { label: 'navy polo',        value: 87  },
];

interface ProductRow {
  id: string;
  name: string;
  category: string;
  revenue: number;
  orders: number;
  avgOrder: number;
}

const TOP_PRODUCTS: ProductRow[] = MOCK_PRODUCTS.slice(0, 6).map((p, i) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  revenue: Math.round(p.price * (30 - i * 3)),
  orders: 30 - i * 3,
  avgOrder: p.price,
}));

const PRODUCT_COLUMNS: TableColumn<ProductRow>[] = [
  { key: 'name',     header: 'Product',  accessor: 'name',    sortable: true },
  { key: 'category', header: 'Category', accessor: 'category', render: (r) => <span className="capitalize text-parmore-slate">{r.category}</span> },
  { key: 'orders',   header: 'Orders',   accessor: 'orders',  sortable: true, align: 'right' },
  {
    key: 'revenue', header: 'Revenue', sortable: true, align: 'right',
    render: (r) => <span className="font-semibold">${r.revenue.toLocaleString()}</span>,
  },
  {
    key: 'avg', header: 'AOV', align: 'right',
    render: (r) => <span>${r.avgOrder}</span>,
  },
];

export default function AnalyticsPage() {
  const admin = MOCK_CURRENT_ADMIN;
  if (!hasScope(admin, 'analytics:read')) redirect('/admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-parmore-black font-serif">Analytics</h1>
        <p className="text-xs text-parmore-slate mt-1">Performance snapshot — month to date</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Revenue MTD" value={14832} prefix="$" sparkData={REVENUE_SPARK} change={12.4} icon={DollarSign} iconBg="bg-parmore-gold/10" delay={0} />
        <KpiCard label="Orders"      value={312}   sparkData={REVENUE_SPARK.map((v) => v * 0.08)} change={8.1}  icon={ShoppingBag} delay={0.05} />
        <KpiCard label="Avg Order"   value={47.5}  prefix="$" decimals={2} change={3.7}  icon={TrendingUp} iconBg="bg-emerald-50" delay={0.1} />
        <KpiCard label="Customers"   value={189}   change={-2.3} icon={Users} iconBg="bg-blue-50" delay={0.15} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top search terms */}
        <ChartSection title="Top Search Terms" subtitle="Last 30 days · all sessions">
          <HBarChart items={TOP_SEARCH_TERMS} valueSuffix=" searches" />
        </ChartSection>

        {/* Conversion funnel (simple) */}
        <ChartSection title="Funnel" subtitle="Session → Purchase">
          <HBarChart
            items={[
              { label: 'Sessions',      value: 4820 },
              { label: 'Product views', value: 2940 },
              { label: 'Add to cart',   value: 861  },
              { label: 'Checkout',      value: 432  },
              { label: 'Purchased',     value: 312  },
            ]}
            color="#1e3a5f"
          />
        </ChartSection>
      </div>

      {/* Top products table */}
      <ChartSection title="Top Products by Revenue" subtitle="Month to date">
        <Table<ProductRow>
          columns={PRODUCT_COLUMNS}
          data={TOP_PRODUCTS}
          keyExtractor={(r) => r.id}
        />
      </ChartSection>
    </div>
  );
}
