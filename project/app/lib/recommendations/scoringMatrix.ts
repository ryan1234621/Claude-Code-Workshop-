// Hybrid scoring layer that extends the base recommendation engine with
// session-intent signals: category affinity, complementary rules, size preference,
// and recency decay on viewed products.

import type { Product } from '@/app/lib/types';
import { scoreProduct, type ScoredProduct } from '@/app/lib/recommendationEngine';

// ─── Intent Context ───────────────────────────────────────────────────────────

export interface IntentContext {
  /** Slugs of products the session has already viewed (used for dedup penalty). */
  viewedSlugs: string[];
  /** category → normalised view-weight (higher = more interest). */
  categoryAffinities: Record<string, number>;
  /** Complement categories pre-computed from the source product via complimentaryRules. */
  complementCategories?: string[];
  /** User's preferred size inferred from viewed in-stock variants. */
  sizePref?: string;
  /** Products that must not appear in results (e.g. already in cart). */
  excludeSlugs?: string[];
}

// ─── Hybrid Weights ───────────────────────────────────────────────────────────

const W = {
  CATEGORY_AFFINITY_MAX: 3.0,   // cap on category affinity contribution
  COMPLEMENT_BOOST:      5.0,   // strong boost for products that complete the kit
  SIZE_AVAILABLE:        1.5,   // preferred size is in stock
  VIEWED_PENALTY:       -8.0,   // product was recently seen — de-rank to surface new items
} as const;

// ─── Hybrid Scorer ────────────────────────────────────────────────────────────

export function hybridScore(
  product: Product,
  context: IntentContext,
  queryTerms: string[] = [],
): ScoredProduct {
  const base = scoreProduct(product, queryTerms);
  let bonus = 0;

  // 1. Category affinity — reward products in categories the session gravitates toward
  const affinity = context.categoryAffinities[product.category] ?? 0;
  bonus += Math.min(affinity, W.CATEGORY_AFFINITY_MAX);

  // 2. Complement boost — product matches a complement category for the viewed source
  if (context.complementCategories?.length) {
    const productSignals = [
      product.category.toLowerCase(),
      (product.subcategory ?? '').toLowerCase(),
      ...product.tags.map((t) => t.toLowerCase()),
    ];
    const isComplement = context.complementCategories.some((c) =>
      productSignals.some((s) => s === c || s.includes(c) || c.includes(s))
    );
    if (isComplement) bonus += W.COMPLEMENT_BOOST;
  }

  // 3. Size preference — boost products that have the preferred size in stock
  if (context.sizePref) {
    const hasPref = product.variants.some((v) =>
      v.sizes.some((s) => s.label === context.sizePref && s.stock > 0)
    );
    if (hasPref) bonus += W.SIZE_AVAILABLE;
  }

  // 4. Recency penalty — de-rank products the session already viewed
  if (context.viewedSlugs.includes(product.slug)) {
    bonus += W.VIEWED_PENALTY;
  }

  return {
    product,
    score: Math.max(0, base.score + bonus),
    matchedTerms: base.matchedTerms,
  };
}

// ─── Hybrid Ranker ────────────────────────────────────────────────────────────

export function hybridRank(
  products: Product[],
  context: IntentContext,
  queryTerms: string[] = [],
  n = 8,
): ScoredProduct[] {
  const exclude = new Set(context.excludeSlugs ?? []);

  return products
    .filter((p) => p.status === 'active' && !exclude.has(p.slug))
    .map((p) => hybridScore(p, context, queryTerms))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}
