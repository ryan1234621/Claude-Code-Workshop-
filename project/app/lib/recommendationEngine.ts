// Pure, side-effect-free recommendation scoring functions.
// All weights are documented so product owners can tune them without touching logic.

import type { Product } from './types';

// ─── Scoring Weights ──────────────────────────────────────────────────────────
// Adjust these to re-balance the ranking without changing algorithm structure.

const W = {
  TAG_MATCH:          3.0,  // each overlapping tag between query terms and product.tags
  NAME_TOKEN_MATCH:   2.0,  // each query token found in the product name
  DESC_TOKEN_MATCH:   0.5,  // each query token found in the product description
  CATEGORY_MATCH:     4.0,  // query term maps directly to product.category/subcategory
  SUBCATEGORY_MATCH:  2.5,  // query term maps to product.subcategory specifically
  BEST_SELLER_BONUS:  1.0,  // static boost for best_seller products
  NEW_ARRIVAL_BONUS:  0.8,  // static boost for new_arrival products
  ON_SALE_BONUS:      0.5,  // product has compare_at_price > price
  FEATURED_BONUS:     0.3,  // product.featured = true
} as const;

// ─── Stop Words ───────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that',
  'the', 'to', 'was', 'were', 'will', 'with', 'i', 'me', 'my',
  'we', 'us', 'our', 'you', 'your', 'they', 'them', 'their',
  'this', 'do', 'can', 'want', 'need', 'get', 'got', 'show',
  'find', 'looking', 'look', 'like', 'some', 'any', 'all',
]);

// Domain-specific synonym expansions to handle golf vocabulary
const SYNONYMS: Record<string, string[]> = {
  cap:         ['headwear', 'hat', 'snapback'],
  hat:         ['headwear', 'cap', 'bucket'],
  bucket:      ['headwear', 'hat', 'bucket'],
  shirt:       ['apparel', 'polo', 'top'],
  polo:        ['apparel', 'polo', 'shirt'],
  pants:       ['apparel', 'trouser', 'bottoms'],
  trousers:    ['apparel', 'pants', 'bottoms'],
  jacket:      ['apparel', 'outerwear', 'layer'],
  pullover:    ['apparel', 'quarter-zip', 'layer', 'outerwear'],
  sweater:     ['apparel', 'crewneck', 'sweatshirt'],
  sweatshirt:  ['apparel', 'crewneck'],
  hoodie:      ['apparel', 'sweatshirt'],
  outerwear:   ['apparel', 'layer', 'jacket'],
  sale:        ['compare_at_price'],
  discount:    ['compare_at_price'],
  new:         ['new_arrival'],
  newest:      ['new_arrival'],
  popular:     ['best_seller'],
  bestseller:  ['best_seller'],
};

// ─── Tokenization ─────────────────────────────────────────────────────────────

/** Lowercases, strips punctuation, removes stop words, expands synonyms. */
export function tokenize(text: string): string[] {
  const raw = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));

  // Expand each raw token with its synonyms
  const expanded = new Set<string>();
  for (const token of raw) {
    expanded.add(token);
    for (const syn of SYNONYMS[token] ?? []) {
      expanded.add(syn);
    }
  }

  return [...expanded];
}

// ─── Product Scorer ───────────────────────────────────────────────────────────

export interface ScoredProduct {
  product: Product;
  score: number;
  matchedTerms: string[];
}

/**
 * Scores a single product against a set of query terms.
 * Returns 0 for completely unrelated products.
 */
export function scoreProduct(product: Product, queryTerms: string[]): ScoredProduct {
  if (queryTerms.length === 0) {
    // No query terms — rank by editorial signals only
    let base = 0;
    if (product.best_seller) base += W.BEST_SELLER_BONUS;
    if (product.new_arrival) base += W.NEW_ARRIVAL_BONUS;
    if (product.featured) base += W.FEATURED_BONUS;
    return { product, score: base, matchedTerms: [] };
  }

  let score = 0;
  const matched: string[] = [];

  const nameTokens = tokenize(product.name);
  const descTokens = tokenize(product.description);
  const categoryTokens = [
    product.category,
    product.subcategory ?? '',
    ...product.tags,
  ].map((s) => s.toLowerCase());

  for (const term of queryTerms) {
    let termMatched = false;

    // Category / subcategory match (highest signal)
    if (term === product.category || term === product.subcategory) {
      score += term === product.subcategory ? W.SUBCATEGORY_MATCH : W.CATEGORY_MATCH;
      termMatched = true;
    }

    // Tag match
    if (product.tags.some((tag) => tag.toLowerCase().includes(term) || term.includes(tag.toLowerCase()))) {
      score += W.TAG_MATCH;
      termMatched = true;
    }

    // Name token match
    if (nameTokens.some((t) => t === term || t.includes(term) || term.includes(t))) {
      score += W.NAME_TOKEN_MATCH;
      termMatched = true;
    }

    // Description token match
    if (descTokens.some((t) => t === term || t.includes(term) || term.includes(t))) {
      score += W.DESC_TOKEN_MATCH;
      termMatched = true;
    }

    if (termMatched) matched.push(term);
  }

  // Editorial signal bonuses (applied regardless of query match)
  if (product.best_seller) score += W.BEST_SELLER_BONUS;
  if (product.new_arrival) score += W.NEW_ARRIVAL_BONUS;
  if (product.featured) score += W.FEATURED_BONUS;
  if (product.compare_at_price && product.compare_at_price > product.price) {
    score += W.ON_SALE_BONUS;
  }

  return { product, score, matchedTerms: matched };
}

// ─── Ranker ───────────────────────────────────────────────────────────────────

/**
 * Ranks a product catalog by relevance to the provided query terms.
 * Returns top-n results (default 6), all with score > 0 unless fewer exist.
 */
export function rankProducts(
  products: Product[],
  queryTerms: string[],
  n = 6,
): ScoredProduct[] {
  const scored = products.map((p) => scoreProduct(p, queryTerms));

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/**
 * Aggregates multiple search sessions into a single deduplicated term list,
 * weighted by recency (more recent sessions contribute more terms).
 */
export function aggregateTerms(sessions: { terms: string[]; timestamp: string }[]): string[] {
  const recencyDecay = (iso: string): number => {
    const ageMs = Date.now() - new Date(iso).getTime();
    const ageHours = ageMs / 3600000;
    // Half-life of 24 hours — terms from a week ago contribute ~0.25 weight
    return Math.exp(-0.693 * ageHours / 24);
  };

  const freq = new Map<string, number>();
  for (const session of sessions) {
    const weight = recencyDecay(session.timestamp);
    for (const term of session.terms) {
      freq.set(term, (freq.get(term) ?? 0) + weight);
    }
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term);
}
