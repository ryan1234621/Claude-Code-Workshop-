import { NextRequest, NextResponse } from 'next/server';
import { evaluateRisk, type RiskSignals } from '@/app/lib/returns/riskScoring';
import { checkReturnEligibility } from '@/app/lib/returns/returnPolicy';
import type { Order } from '@/app/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      order: Order;
      signals: Omit<RiskSignals, 'reason' | 'returnValueUsd' | 'hasPhotoProof' | 'daysSincePurchase' | 'orderTotal'> & Partial<RiskSignals>;
      returnValueUsd: number;
      reason: RiskSignals['reason'];
      hasPhotoProof?: boolean;
    };

    const { order, signals, returnValueUsd, reason, hasPhotoProof = false } = body;

    if (!order || !reason || returnValueUsd == null) {
      return NextResponse.json(
        { error: 'Missing required fields: order, reason, returnValueUsd' },
        { status: 400 }
      );
    }

    const eligibility = checkReturnEligibility(order);
    if (!eligibility.eligible) {
      return NextResponse.json({ error: eligibility.reason }, { status: 422 });
    }

    const daysSincePurchase = RETURN_WINDOW_DAYS - eligibility.daysRemaining;

    const result = evaluateRisk({
      ...signals,
      reason,
      returnValueUsd,
      hasPhotoProof,
      daysSincePurchase,
      orderTotal: order.total,
    });

    return NextResponse.json({
      ...result,
      eligibility: { daysRemaining: eligibility.daysRemaining, canExchange: eligibility.canExchange },
    });
  } catch (err) {
    console.error('[evaluate-risk]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Local import to avoid circular dep
import { RETURN_WINDOW_DAYS } from '@/app/lib/returns/returnPolicy';
