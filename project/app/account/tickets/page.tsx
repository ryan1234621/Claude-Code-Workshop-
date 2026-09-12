'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MessageSquare, Plus, ChevronRight, Filter, Inbox } from 'lucide-react';
import { TicketStatusBadge } from '@/components/TicketStatusBadge';
import { CreateTicketModal } from '@/components/CreateTicketModal';
import { MOCK_TICKETS } from '@/app/lib/mockData';
import type { TicketStatus, TicketCategory } from '@/app/lib/types';
import { ticketCategoryLabel, relativeTime, formatDate } from '@/app/lib/utils';
import { cn } from '@/app/lib/utils';

const STATUS_FILTERS: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'All Tickets' },
  { value: 'open',      label: 'Open' },
  { value: 'in_review', label: 'In Review' },
  { value: 'actioned',  label: 'Actioned' },
  { value: 'resolved',  label: 'Resolved' },
  { value: 'closed',    label: 'Closed' },
];

export default function TicketsPage() {
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = MOCK_TICKETS.filter(
    (t) => statusFilter === 'all' || t.status === statusFilter
  );

  const handleTicketSubmit = async (payload: unknown) => {
    await new Promise((r) => setTimeout(r, 1000));
    console.log('Ticket submitted:', payload);
  };

  return (
    <div className="max-w-3xl">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-bold">Support Tickets</h1>
          <p className="text-sm text-parmore-slate mt-1">
            {MOCK_TICKETS.length} ticket{MOCK_TICKETS.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-parmore-black text-white text-sm font-medium rounded-sm hover:bg-zinc-800 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Open Ticket
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto hide-scrollbar pb-1">
        <Filter className="h-4 w-4 text-parmore-slate shrink-0" strokeWidth={1.5} />
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              statusFilter === value
                ? 'bg-parmore-black text-white'
                : 'bg-white border border-zinc-200 text-parmore-slate hover:border-parmore-black hover:text-parmore-black'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-sm border border-zinc-100">
          <Inbox className="h-10 w-10 text-zinc-300 mx-auto mb-4" strokeWidth={1} />
          <p className="font-serif text-lg font-bold mb-1">No tickets found</p>
          <p className="text-sm text-parmore-slate mb-4">
            {statusFilter !== 'all'
              ? 'No tickets with this status.'
              : "You haven't opened any support tickets yet."}
          </p>
          {statusFilter === 'all' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-parmore-black text-white text-sm font-medium rounded-sm hover:bg-zinc-800 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Open Your First Ticket
            </button>
          )}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07 } },
          }}
          className="space-y-3"
        >
          {filtered.map((ticket) => (
            <motion.div
              key={ticket.id}
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
              }}
            >
              <Link
                href={`/account/tickets/${ticket.id}`}
                className="group block bg-white rounded-sm border border-zinc-100 shadow-luxury hover:border-parmore-gold/40 hover:shadow-luxury-lg transition-all"
              >
                <div className="px-5 py-4 flex items-start gap-4">
                  {/* Icon */}
                  <div className="h-9 w-9 rounded-full bg-parmore-cream flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="h-4 w-4 text-parmore-black" strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="text-sm font-semibold text-parmore-black truncate">
                        {ticket.subject}
                      </p>
                      <TicketStatusBadge status={ticket.status} size="sm" />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-parmore-slate">
                      <span className="font-mono">{ticket.ticket_number}</span>
                      <span>·</span>
                      <span>{ticketCategoryLabel(ticket.category)}</span>
                      {ticket.order_id && (
                        <>
                          <span>·</span>
                          <span className="text-parmore-black font-medium">Order attached</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-zinc-400">
                        Opened {formatDate(ticket.created_at)}
                        {ticket.updated_at !== ticket.created_at && (
                          <> · Updated {relativeTime(ticket.updated_at)}</>
                        )}
                      </p>
                      <ChevronRight
                        className="h-4 w-4 text-zinc-300 group-hover:text-parmore-gold transition-colors shrink-0"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleTicketSubmit}
        mode="ticket"
      />
    </div>
  );
}
