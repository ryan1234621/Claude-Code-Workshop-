'use client';

import React, { useState } from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Hash, Tag, Calendar } from 'lucide-react';
import { MOCK_CURRENT_ADMIN, hasScope } from '@/app/lib/permissions';
import { MOCK_TICKETS, MOCK_TICKET_MESSAGES } from '@/app/lib/mockData';
import { TicketResolutionBar } from '@/components/admin/TicketResolutionBar';
import { TicketChat } from '@/components/TicketChat';
import type { TicketStatus, TicketMessage } from '@/app/lib/types';
import { ticketStatusConfig, ticketCategoryLabel, formatDate } from '@/app/lib/utils';
import { cn } from '@/app/lib/utils';

export default function AdminTicketDetailPage({ params }: { params: { id: string } }) {
  const admin = MOCK_CURRENT_ADMIN;
  if (!hasScope(admin, 'tickets:read')) redirect('/admin');

  const ticket = MOCK_TICKETS.find((t) => t.id === params.id);
  if (!ticket) notFound();

  const [status, setStatus] = useState(ticket.status);
  const [messages, setMessages] = useState<TicketMessage[]>(MOCK_TICKET_MESSAGES[ticket.id] ?? []);

  const cfg = ticketStatusConfig(status);

  const handleStatusChange = async (to: TicketStatus) => {
    await new Promise((r) => setTimeout(r, 500));
    setStatus(to);
    const sysMsg: TicketMessage = {
      id: `sys-${Date.now()}`,
      ticket_id: ticket.id,
      sender_id: admin.id,
      sender_name: 'System',
      content: `Status changed to ${ticketStatusConfig(to).label} by ${admin.full_name}.`,
      is_agent: false,
      is_system: true,
      attachments: [],
      created_at: new Date().toISOString(),
    };
    setMessages((ms) => [...ms, sysMsg]);
  };

  const handleRefund = async (amount: number, reason: string) => {
    await new Promise((r) => setTimeout(r, 800));
    const sysMsg: TicketMessage = {
      id: `refund-${Date.now()}`,
      ticket_id: ticket.id,
      sender_id: admin.id,
      sender_name: 'System',
      content: `Refund of $${amount.toFixed(2)} issued by ${admin.full_name}. Reason: ${reason}`,
      is_agent: false,
      is_system: true,
      attachments: [],
      created_at: new Date().toISOString(),
    };
    setMessages((ms) => [...ms, sysMsg]);
  };

  const handleSend = async (content: string): Promise<TicketMessage> => {
    await new Promise((r) => setTimeout(r, 400));
    const msg: TicketMessage = {
      id: `msg-${Date.now()}`,
      ticket_id: ticket.id,
      sender_id: admin.id,
      sender_name: admin.full_name,
      content,
      is_agent: true,
      is_system: false,
      attachments: [],
      created_at: new Date().toISOString(),
    };
    setMessages((ms) => [...ms, msg]);
    return msg;
  };

  const PRIORITY_LABEL: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Urgent', 5: 'Critical' };
  const PRIORITY_COLOR: Record<number, string> = {
    1: 'text-zinc-400', 2: 'text-blue-600', 3: 'text-amber-600', 4: 'text-orange-600', 5: 'text-red-600',
  };

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link href="/admin/tickets" className="inline-flex items-center gap-1.5 text-xs text-parmore-slate hover:text-parmore-black transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        All Tickets
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: messages */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-sm border border-zinc-100 shadow-luxury p-5">
            <h1 className="text-sm font-bold text-parmore-black mb-1">{ticket.subject}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={cn('px-2 py-0.5 rounded-full text-2xs font-medium', cfg.bg, cfg.text)}>{cfg.label}</span>
              <span className="text-2xs text-parmore-slate font-mono">{ticket.ticket_number}</span>
              <span className={cn('text-2xs font-medium', PRIORITY_COLOR[ticket.priority])}>
                P{ticket.priority} — {PRIORITY_LABEL[ticket.priority]}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-sm border border-zinc-100 shadow-luxury overflow-hidden">
            <TicketChat
              ticketId={ticket.id}
              initialMessages={messages}
              isReadOnly={status === 'closed'}
              onSendMessage={handleSend}
              onSubscribe={() => undefined}
            />
          </div>
        </div>

        {/* Right: details + resolution */}
        <div className="space-y-4">
          {/* Resolution bar */}
          <div className="bg-white rounded-sm border border-zinc-100 shadow-luxury p-5">
            <p className="text-xs font-semibold text-parmore-black mb-3">Resolution</p>
            <TicketResolutionBar
              ticket={{ ...ticket, status }}
              admin={admin}
              onStatusChange={handleStatusChange}
              onRefund={handleRefund}
            />
          </div>

          {/* Ticket details */}
          <div className="bg-white rounded-sm border border-zinc-100 shadow-luxury p-5 space-y-3">
            <p className="text-xs font-semibold text-parmore-black">Details</p>
            {[
              { icon: User,     label: 'Customer', value: ticket.user_id },
              { icon: Tag,      label: 'Category', value: ticketCategoryLabel(ticket.category) },
              { icon: Hash,     label: 'Reference', value: ticket.ticket_number },
              { icon: Calendar, label: 'Opened',   value: formatDate(ticket.created_at) },
              ticket.order_id ? { icon: Hash, label: 'Order', value: ticket.order_id } : null,
            ].filter(Boolean).map((item) => {
              if (!item) return null;
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-2.5">
                  <Icon className="h-3.5 w-3.5 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="text-2xs text-parmore-slate">{item.label}</p>
                    <p className="text-xs text-parmore-black font-medium">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
