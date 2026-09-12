'use client';

import React, { useState } from 'react';
import type { Metadata } from 'next';
import { motion } from 'framer-motion';
import { Package, Filter } from 'lucide-react';
import { OrderCard } from '@/components/OrderCard';
import { CreateTicketModal } from '@/components/CreateTicketModal';
import { MOCK_ORDERS, MOCK_USER } from '@/app/lib/mockData';
import type { Order, OrderStatus } from '@/app/lib/types';
import { cn } from '@/app/lib/utils';

const STATUS_FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all',        label: 'All Orders' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped',    label: 'Shipped' },
  { value: 'delivered',  label: 'Delivered' },
  { value: 'cancelled',  label: 'Cancelled' },
];

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [ticketModal, setTicketModal] = useState<{
    open: boolean;
    order?: Order;
    mode: 'ticket' | 'return';
    itemIndex?: number;
  }>({ open: false, mode: 'ticket' });

  const filtered = MOCK_ORDERS.filter(
    (o) => statusFilter === 'all' || o.status === statusFilter
  );

  const handleOpenTicket = (order: Order) => {
    setTicketModal({ open: true, order, mode: 'ticket' });
  };

  const handleOpenReturn = (order: Order, itemIndex?: number) => {
    setTicketModal({ open: true, order, mode: 'return', itemIndex });
  };

  const handleTicketSubmit = async (payload: unknown) => {
    await new Promise((r) => setTimeout(r, 1000));
    console.log('Ticket submitted:', payload);
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-serif font-bold">Order History</h1>
        <p className="text-sm text-parmore-slate mt-1">
          {MOCK_ORDERS.length} order{MOCK_ORDERS.length !== 1 ? 's' : ''} placed
        </p>
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

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-sm border border-zinc-100">
          <Package className="h-10 w-10 text-zinc-300 mx-auto mb-4" strokeWidth={1} />
          <p className="font-serif text-lg font-bold mb-1">No orders found</p>
          <p className="text-sm text-parmore-slate">
            {statusFilter !== 'all' ? 'No orders with this status.' : "You haven't placed any orders yet."}
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="space-y-4"
        >
          {filtered.map((order) => (
            <motion.div
              key={order.id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
              }}
            >
              <OrderCard
                order={order}
                onOpenTicket={handleOpenTicket}
                onOpenReturnModal={handleOpenReturn}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Ticket / Return Modal */}
      <CreateTicketModal
        isOpen={ticketModal.open}
        onClose={() => setTicketModal((s) => ({ ...s, open: false }))}
        onSubmit={handleTicketSubmit}
        prefilledOrder={ticketModal.order}
        prefilledItemIndex={ticketModal.itemIndex}
        mode={ticketModal.mode}
      />
    </div>
  );
}
