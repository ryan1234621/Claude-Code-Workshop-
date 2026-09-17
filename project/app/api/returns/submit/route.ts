import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/app/lib/database.types';
import type { ReturnReason, ReturnItem } from '@/app/lib/types';
import { evaluateRisk, type RiskSignals } from '@/app/lib/returns/riskScoring';
import { checkReturnEligibility, requiresPhotoProof } from '@/app/lib/returns/returnPolicy';
import type { ExchangeChoice } from '@/components/returns/InstantExchangeOffer';

// Server-side client with service role key for RLS bypass on server operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_RETURNS_URL;

interface SubmitReturnPayload {
  orderId: string;
  userId: string;
  items: ReturnItem[];
  reason: ReturnReason;
  notes?: string;
  photoProofPaths?: string[];
  riskSignals: Partial<RiskSignals>;
  exchangeChoices?: ExchangeChoice[];
  isExchange: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: SubmitReturnPayload = await req.json();
    const {
      orderId, userId, items, reason, notes,
      photoProofPaths = [], riskSignals, exchangeChoices = [], isExchange,
    } = body;

    if (!orderId || !userId || !items?.length || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, userId, items, reason' },
        { status: 400 }
      );
    }

    // Fetch the order to run eligibility + risk checks server-side
    const { data: orderRow, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderErr || !orderRow) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const eligibility = checkReturnEligibility(orderRow as Parameters<typeof checkReturnEligibility>[0]);
    if (!eligibility.eligible) {
      return NextResponse.json({ error: eligibility.reason }, { status: 422 });
    }

    const returnValueUsd = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const hasPhotoProof = photoProofPaths.length > 0;
    const daysSincePurchase = 30 - eligibility.daysRemaining;

    const risk = evaluateRisk({
      totalOrders: riskSignals.totalOrders ?? 1,
      totalReturns: riskSignals.totalReturns ?? 0,
      reason,
      returnValueUsd,
      hasPhotoProof,
      daysSincePurchase,
      orderTotal: orderRow.total as number,
      accountAgeDays: riskSignals.accountAgeDays,
      priorFraudFlag: riskSignals.priorFraudFlag ?? false,
    });

    // Determine initial return status based on risk
    const initialStatus = risk.autoApprove ? 'approved'
      : risk.requiresReview ? 'requested'
      : 'approved';

    // Persist to DB
    const { data: rmaRow, error: insertErr } = await supabaseAdmin
      .from('return_requests')
      .insert({
        user_id: userId,
        order_id: orderId,
        items: items as unknown as Record<string, unknown>[],
        reason,
        notes: notes ?? '',
        status: initialStatus,
        refund_amount: returnValueUsd,
      })
      .select()
      .single();

    if (insertErr || !rmaRow) {
      console.error('[returns/submit] DB insert error', insertErr);
      return NextResponse.json({ error: 'Failed to create return' }, { status: 500 });
    }

    // Attach photo proof paths to metadata via update
    if (photoProofPaths.length > 0) {
      await supabaseAdmin
        .from('return_requests')
        .update({ metadata: { photo_proof_paths: photoProofPaths } } as Record<string, unknown>)
        .eq('id', rmaRow.id);
    }

    // Dispatch n8n webhook (fire-and-forget)
    if (N8N_WEBHOOK_URL) {
      fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: isExchange ? 'exchange.submitted' : 'return.submitted',
          rmaId: rmaRow.id,
          returnNumber: rmaRow.return_number,
          orderId,
          userId,
          riskTier: risk.tier,
          riskScore: risk.score,
          autoApprove: risk.autoApprove,
          requiresReview: risk.requiresReview,
          requiresPhotoProof: risk.requiresPhotoProof,
          exchangeChoices: isExchange ? exchangeChoices : undefined,
          items,
          reason,
          returnValueUsd,
          timestamp: new Date().toISOString(),
        }),
      }).catch((e) => console.warn('[n8n webhook]', e));
    }

    // If label is auto-approved, generate mock tracking
    let labelIssued = false;
    if (risk.autoApprove) {
      const mockTracking = '1Z' + Math.random().toString(36).slice(2, 14).toUpperCase();
      await supabaseAdmin
        .from('return_requests')
        .update({ tracking_number: mockTracking, return_label: `/labels/${rmaRow.return_number}.pdf` })
        .eq('id', rmaRow.id);
      labelIssued = true;
    }

    return NextResponse.json({
      success: true,
      returnNumber: rmaRow.return_number,
      rmaId: rmaRow.id,
      status: initialStatus,
      riskTier: risk.tier,
      riskScore: risk.score,
      autoApprove: risk.autoApprove,
      requiresReview: risk.requiresReview,
      labelIssued,
      eligibility: {
        daysRemaining: eligibility.daysRemaining,
        canExchange: eligibility.canExchange,
      },
    });
  } catch (err) {
    console.error('[returns/submit]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
