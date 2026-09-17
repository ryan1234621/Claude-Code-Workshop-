import type { ReturnReason } from '@/app/lib/types';

export type RiskTier = 'low' | 'standard' | 'high';

export interface RiskSignals {
  // Account history
  totalOrders: number;
  totalReturns: number;
  // This request
  reason: ReturnReason;
  returnValueUsd: number;
  hasPhotoProof: boolean;
  // Order context
  daysSincePurchase: number;
  orderTotal: number;
  // Optional enrichment
  accountAgeDays?: number;
  priorFraudFlag?: boolean;
}

export interface RiskScore {
  tier: RiskTier;
  score: number;       // 0–100 (higher = more risk)
  factors: string[];   // human-readable flags
  autoApprove: boolean;
  requiresReview: boolean;
  requiresPhotoProof: boolean;
}

// Score weights — each signal adds to a 0-100 scale
const W = {
  returnRateHigh:      25,  // >40% return rate
  returnRateMed:       12,  // 20-40% return rate
  highValueReturn:     20,  // return > $200
  medValueReturn:      8,   // return $100-200
  changedMind:         10,  // low-credibility reason
  noPhotoOnDefect:     15,  // defective/wrong-item without proof
  lateClaim:           12,  // >20 days since purchase
  newAccount:          8,   // account < 30 days
  priorFraud:          40,  // prior fraud flag (hard override)
  firstOrder:          5,   // first order from account
};

export function evaluateRisk(signals: RiskSignals): RiskScore {
  let score = 0;
  const factors: string[] = [];

  if (signals.priorFraudFlag) {
    score += W.priorFraud;
    factors.push('Prior fraud flag on account');
  }

  const returnRate = signals.totalOrders > 0
    ? signals.totalReturns / signals.totalOrders
    : 0;

  if (returnRate > 0.4) {
    score += W.returnRateHigh;
    factors.push(`High return rate (${Math.round(returnRate * 100)}%)`);
  } else if (returnRate > 0.2) {
    score += W.returnRateMed;
    factors.push(`Elevated return rate (${Math.round(returnRate * 100)}%)`);
  }

  if (signals.returnValueUsd > 200) {
    score += W.highValueReturn;
    factors.push(`High-value return ($${signals.returnValueUsd.toFixed(2)})`);
  } else if (signals.returnValueUsd > 100) {
    score += W.medValueReturn;
    factors.push(`Medium-value return ($${signals.returnValueUsd.toFixed(2)})`);
  }

  if (signals.reason === 'changed_mind') {
    score += W.changedMind;
    factors.push('Reason: changed mind');
  }

  const defectReasons: ReturnReason[] = ['defective', 'wrong_item', 'not_as_described'];
  if (defectReasons.includes(signals.reason) && !signals.hasPhotoProof) {
    score += W.noPhotoOnDefect;
    factors.push('Defect/damage claimed without photo proof');
  }

  if (signals.daysSincePurchase > 20) {
    score += W.lateClaim;
    factors.push(`Late return claim (day ${signals.daysSincePurchase})`);
  }

  if (signals.accountAgeDays !== undefined && signals.accountAgeDays < 30) {
    score += W.newAccount;
    factors.push('New account (<30 days)');
  }

  if (signals.totalOrders === 1) {
    score += W.firstOrder;
    factors.push('First order from this account');
  }

  score = Math.min(100, score);

  let tier: RiskTier;
  if (score < 20) tier = 'low';
  else if (score < 50) tier = 'standard';
  else tier = 'high';

  return {
    tier,
    score,
    factors,
    autoApprove: tier === 'low',
    requiresReview: tier === 'high',
    requiresPhotoProof:
      defectReasons.includes(signals.reason) || tier === 'high',
  };
}

export function riskTierConfig(tier: RiskTier): {
  label: string;
  color: string;
  bg: string;
  description: string;
} {
  const map: Record<RiskTier, { label: string; color: string; bg: string; description: string }> = {
    low: {
      label: 'Low Risk',
      color: 'text-green-700',
      bg: 'bg-green-50',
      description: 'Instant approval — prepaid label issued immediately.',
    },
    standard: {
      label: 'Standard',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      description: 'Approved — label issued within 2 business hours.',
    },
    high: {
      label: 'Review Required',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      description: 'Manual review needed — typically resolved within 24 hours.',
    },
  };
  return map[tier];
}
