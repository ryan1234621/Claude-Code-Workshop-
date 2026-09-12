'use client';

import React, { useEffect, useRef } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Package } from 'lucide-react';
import { TicketChat } from '@/components/TicketChat';
import { TicketStatusBadge, TicketStatusProgress } from '@/components/TicketStatusBadge';
import { MOCK_TICKETS, MOCK_TICKET_MESSAGES, MOCK_ORDERS, MOCK_USER } from '@/app/lib/mockData';
import { ticketCategoryLabel, formatDate } from '@/app/lib/utils';
import { subscribeToTicketMessages } from '@/app/lib/supabaseClient';
import type { TicketMessage } from '@/app/lib/types';

interface TicketDetailPageProps {
  params: { id: string };
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const ticket = MOCK_TICKETS.find((t) => t.id === params.id);

  if (!ticket) {
    notFound();
  }

  const initialMessages = MOCK_TICKET_MESSAGES[ticket.id] ?? [];
  const attachedOrder = ticket.order_id
    ? MOCK_ORDERS.find((o) => o.id === ticket.order_id)
    : undefined;

  const handleSendMessage = async (content: string): Promise<TicketMessage> => {
    // In production: call sendTicketMessage(ticket.id, content)
    await new Promise((r) => setTimeout(r, 600));
    return {
      id: `msg-${Date.now()}`,
      ticket_id: ticket.id,
      sender_id: MOCK_USER.id,
      sender_name: MOCK_USER.full_name,
      content,
      is_agent: false,
      is_system: false,
      attachments: [],
      created_at: new Date().toISOString(),
    };
  };

  const isTicketClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <div className="max-w-3xl">
      {/* Back link */}
      <Link
        href="/account/tickets"
        className="inline-flex items-center gap-1.5 text-xs text-parmore-slate hover:text-parmore-black transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to tickets
      </Link>

      {/* Ticket header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-sm border border-zinc-100 shadow-luxury mb-5"
      >
        <div className="px-5 py-5 border-b border-zinc-100">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="text-base font-semibold leading-snug">{ticket.subject}</h1>
            <TicketStatusBadge status={ticket.status} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-parmore-slate">
            <span className="font-mono font-medium text-parmore-black">{ticket.ticket_number}</span>
            <span>{ticketCategoryLabel(ticket.category)}</span>
            <span>Opened {formatDate(ticket.created_at)}</span>
          </div>
        </div>

        {/* Status progress */}
        <div className="px-5 py-5">
          <p className="text-xs font-semibold tracking-wider uppercase text-parmore-slate mb-4">
            Ticket Progress
          </p>
          <TicketStatusProgress status={ticket.status} />
        </div>

        {/* Attached order */}
        {attachedOrder && (
          <div className="px-5 pb-5">
            <div className="flex items-center gap-2.5 p-3 bg-parmore-cream rounded-sm">
              <Package className="h-4 w-4 text-parmore-black shrink-0" strokeWidth={1.5} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">{attachedOrder.order_number}</p>
                <p className="text-xs text-parmore-slate truncate">
                  {attachedOrder.items.map((i) => i.product_name).join(', ')}
                </p>
              </div>
              <Link
                href="/account/orders"
                className="text-xs text-parmore-gold hover:underline shrink-0"
              >
                View order
              </Link>
            </div>
          </div>
        )}
      </motion.div>

      {/* Chat */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="h-[520px]"
      >
        <TicketChat
          ticketId={ticket.id}
          initialMessages={initialMessages}
          currentUserId={MOCK_USER.id}
          currentUserName={MOCK_USER.full_name}
          isTicketClosed={isTicketClosed}
          onSendMessage={handleSendMessage}
          onSubscribe={(ticketId, onNewMessage) => {
            // In production: wire Supabase Realtime
            // subscribeToTicketMessages(ticketId, onNewMessage)
            // Returns unsubscribe function — return undefined for mock
            return undefined;
          }}
        />
      </motion.div>
    </div>
  );
}
