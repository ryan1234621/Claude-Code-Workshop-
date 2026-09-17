import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/app/lib/database.types';

const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Simple HMAC-like secret verification using a shared webhook secret
const WEBHOOK_SECRET = process.env.CARRIER_WEBHOOK_SECRET;

type CarrierScanEvent =
  | 'label_created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'  // unused for returns, included for symmetry
  | 'delivered_to_facility'
  | 'delivery_failed'
  | 'exception';

interface CarrierScanPayload {
  event: CarrierScanEvent;
  trackingNumber: string;
  returnNumber?: string;
  carrier: string;
  timestamp: string;
  location?: {
    city: string;
    state: string;
    zip?: string;
  };
  metadata?: Record<string, unknown>;
}

// Maps carrier scan events to return_requests status transitions
const EVENT_STATUS_MAP: Partial<Record<CarrierScanEvent, string>> = {
  picked_up:             'shipped_back',
  in_transit:            'shipped_back',
  delivered_to_facility: 'received',
};

export async function POST(req: NextRequest) {
  // Verify shared secret if configured
  if (WEBHOOK_SECRET) {
    const sig = req.headers.get('x-webhook-secret') ?? req.headers.get('x-carrier-signature');
    if (sig !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let payload: CarrierScanPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { event, trackingNumber, returnNumber, carrier, timestamp, location } = payload;

  if (!event || !trackingNumber) {
    return NextResponse.json(
      { error: 'Missing required fields: event, trackingNumber' },
      { status: 400 }
    );
  }

  // Locate the RMA by tracking number or return number
  const query = supabaseAdmin
    .from('return_requests')
    .select('id, status, return_number, user_id, order_id')
    .eq('tracking_number', trackingNumber);

  const { data: rows, error: fetchErr } = await query;
  if (fetchErr) {
    console.error('[carrier-scan] fetch error', fetchErr);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  const rma = rows?.[0];
  if (!rma) {
    console.warn('[carrier-scan] no RMA found for tracking', trackingNumber);
    // Acknowledge receipt so carrier doesn't retry; log for ops
    return NextResponse.json({ received: true, matched: false });
  }

  const newStatus = EVENT_STATUS_MAP[event];

  if (newStatus) {
    // Only advance — never move backwards through the workflow
    const statusOrder = ['requested', 'approved', 'shipped_back', 'received', 'refunded'];
    const currentIdx = statusOrder.indexOf(rma.status ?? '');
    const newIdx = statusOrder.indexOf(newStatus);

    if (newIdx > currentIdx) {
      const { error: updateErr } = await supabaseAdmin
        .from('return_requests')
        .update({ status: newStatus, updated_at: timestamp ?? new Date().toISOString() } as Record<string, unknown>)
        .eq('id', rma.id);

      if (updateErr) {
        console.error('[carrier-scan] update error', updateErr);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
      }

      // When received, trigger refund workflow via n8n
      if (newStatus === 'received' && process.env.N8N_WEBHOOK_RETURNS_URL) {
        fetch(process.env.N8N_WEBHOOK_RETURNS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'return.received',
            rmaId: rma.id,
            returnNumber: rma.return_number,
            orderId: rma.order_id,
            userId: rma.user_id,
            carrier,
            location,
            scanTimestamp: timestamp,
          }),
        }).catch((e) => console.warn('[n8n refund trigger]', e));
      }
    }
  }

  return NextResponse.json({
    received: true,
    matched: true,
    rmaId: rma.id,
    returnNumber: rma.return_number,
    event,
    newStatus: newStatus ?? null,
  });
}
