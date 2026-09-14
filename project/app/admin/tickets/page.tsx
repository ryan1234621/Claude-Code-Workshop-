'use client';

import React, { useState } from 'react';
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { MOCK_CURRENT_ADMIN, hasScope } from '@/app/lib/permissions';
import { MOCK_TICKETS } from '@/app/lib/mockData';
import { Table } from '@/components/ui/Table';
import type { TableColumn } from '@/components/ui/Table';
import type { SupportTicket, TicketStatus, TicketCategory } from '@/app/lib/types';
import { ticketStatusConfig, ticketCategoryLabel, relativeTime } from '@/app/lib/utils';
import { cn } from '@/app/lib/utils';

type StatusFilter = TicketStatus | 'all';

const CATEGORY_FILTERS: { label: string; value: TicketCategory | 'all' }[] = [
  { label: 'All Categories', value: 'all' },
  { label: 'Order Issue',    value: 'order_issue' },
  { label: 'Return',         value: 'return_request' },
  { label: 'Shipping',       value: 'shipping' },
  { label: 'Billing',        value: 'billing' },
  { label: 'Other',          value: 'other' },
];

export default function AdminTicketsPage() {
  const admin = MOCK_CURRENT_ADMIN;
  if (!hasScope(admin, 'tickets:read')) redirect('/admin');

  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');

  const tickets = MOCK_TICKETS.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
    { label: 'All',       value: 'all' },
    { label: 'Open',      value: 'open' },
    { label: 'In Review', value: 'in_review' },
    { label: 'Actioned',  value: 'actioned' },
    { label: 'Resolved',  value: 'resolved' },
    { label: 'Closed',    value: 'closed' },
  ];

  const COLUMNS: TableColumn<SupportTicket>[] = [
    {
      key: 'ticket', header: 'Ticket',
      render: (t) => (
        <div>
          <p className="text-xs font-medium text-parmore-black">{t.subject}</p>
          <p className="text-2xs text-parmore-slate mt-0.5">{t.ticket_number}</p>
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (t) => {
        const cfg = ticketStatusConfig(t.status);
        return (
          <span className={cn('px-2 py-0.5 rounded-full text-2xs font-medium', cfg.bg, cfg.text)}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: 'category', header: 'Category',
      render: (t) => <span className="text-xs text-parmore-slate">{ticketCategoryLabel(t.category)}</span>,
    },
    {
      key: 'customer', header: 'Customer',
      render: (t) => <span className="text-xs text-parmore-slate">{t.user_id}</span>,
    },
    {
      key: 'created', header: 'Created', sortable: true,
      render: (t) => <span className="text-xs text-parmore-slate">{relativeTime(t.created_at)}</span>,
    },
    {
      key: 'updated', header: 'Updated', sortable: true,
      render: (t) => <span className="text-xs text-parmore-slate">{relativeTime(t.updated_at)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-parmore-black font-serif">Support Tickets</h1>
        <p className="text-xs text-parmore-slate mt-1">{tickets.length} tickets shown</p>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-sm text-xs font-medium transition-colors',
                statusFilter === f.value
                  ? 'bg-parmore-black text-white'
                  : 'bg-white border border-zinc-200 text-parmore-slate hover:border-zinc-400'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setCategoryFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-sm text-xs font-medium transition-colors',
                categoryFilter === f.value
                  ? 'bg-zinc-700 text-white'
                  : 'bg-white border border-zinc-200 text-parmore-slate hover:border-zinc-400'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-sm border border-zinc-100 shadow-luxury">
        <Table<SupportTicket>
          columns={COLUMNS}
          data={tickets}
          keyExtractor={(t) => t.id}
          emptyMessage="No tickets match the selected filters."
          onRowClick={(t) => router.push(`/admin/tickets/${t.id}`)}
        />
      </div>
    </div>
  );
}
