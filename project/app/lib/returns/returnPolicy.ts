import type { Order, OrderItem, ReturnReason } from '@/app/lib/types';

export const RETURN_WINDOW_DAYS = 30;
export const EXCHANGE_WINDOW_DAYS = 60;

// Categories and tags that are explicitly non-returnable
const NON_RETURNABLE_SUBCATEGORIES = new Set(['gift-card', 'digital', 'customized']);
const NON_RETURNABLE_TAGS = new Set(['final-sale', 'no-returns', 'personalized']);

export type EligibilityResult =
  | { eligible: true; daysRemaining: number; canExchange: boolean }
  | { eligible: false; reason: string };

export function checkReturnEligibility(order: Order): EligibilityResult {
  const deliveredStatuses = new Set(['delivered']);
  if (!deliveredStatuses.has(order.status)) {
    return {
      eligible: false,
      reason: `Orders must be delivered before a return can be initiated. Current status: ${order.status}.`,
    };
  }

  const purchaseDate = new Date(order.created_at);
  const now = new Date();
  const daysSincePurchase = Math.floor(
    (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSincePurchase > RETURN_WINDOW_DAYS) {
    return {
      eligible: false,
      reason: `The ${RETURN_WINDOW_DAYS}-day return window has closed (${daysSincePurchase} days since purchase).`,
    };
  }

  const daysRemaining = RETURN_WINDOW_DAYS - daysSincePurchase;
  const canExchange = daysSincePurchase <= EXCHANGE_WINDOW_DAYS;
  return { eligible: true, daysRemaining, canExchange };
}

export function checkItemEligibility(item: OrderItem): {
  eligible: boolean;
  reason?: string;
} {
  // In a real system these would come from the product record; we check via
  // naming heuristic since mock data doesn't carry subcategory/tags per line item.
  const nameLower = item.product_name.toLowerCase();
  if (nameLower.includes('gift card') || nameLower.includes('custom')) {
    return { eligible: false, reason: 'This item is not eligible for returns.' };
  }
  return { eligible: true };
}

export function getReturnReasonLabel(reason: ReturnReason): string {
  const map: Record<ReturnReason, string> = {
    wrong_size:       'Wrong size ordered',
    wrong_item:       'Received wrong item',
    defective:        'Item is defective / damaged',
    not_as_described: 'Not as described',
    changed_mind:     'Changed my mind',
    other:            'Other reason',
  };
  return map[reason];
}

// Whether the reason warrants requesting photo proof
export function requiresPhotoProof(reason: ReturnReason): boolean {
  return reason === 'defective' || reason === 'wrong_item' || reason === 'not_as_described';
}

// Whether an instant exchange should be offered (size swap on same product)
export function canOfferInstantExchange(
  reason: ReturnReason,
  daysRemaining: number
): boolean {
  const exchangeReasons: ReturnReason[] = ['wrong_size', 'wrong_item', 'defective'];
  return exchangeReasons.includes(reason) && daysRemaining > 0;
}
