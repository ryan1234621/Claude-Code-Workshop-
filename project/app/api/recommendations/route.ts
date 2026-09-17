import { NextRequest, NextResponse } from 'next/server';
import { tokenize, rankProducts, aggregateTerms } from '@/app/lib/recommendationEngine';
import { hybridRank } from '@/app/lib/recommendations/scoringMatrix';
import type { IntentContext } from '@/app/lib/recommendations/scoringMatrix';
import { MOCK_PRODUCTS } from '@/app/lib/mockData';
import { getEventStore } from '@/app/api/search-events/route';

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 20;

// ─── GET /api/recommendations ─────────────────────────────────────────────────
// Legacy endpoint — term-based ranking from URL params. Preserved for backwards compat.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawTerms = searchParams.get('terms') ?? '';
  const limitParam = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
  const limit = Math.min(Math.max(1, limitParam), MAX_LIMIT);

  let queryTerms: string[];
  if (rawTerms.trim()) {
    queryTerms = tokenize(rawTerms);
  } else {
    const store = getEventStore();
    queryTerms = aggregateTerms(store.slice(-20));
  }

  const products = MOCK_PRODUCTS.filter((p) => p.status === 'active');
  const ranked = rankProducts(products, queryTerms, limit);

  return NextResponse.json({
    terms: queryTerms,
    results: ranked.map((r) => ({ product: r.product, score: r.score, matchedTerms: r.matchedTerms })),
    count: ranked.length,
  });
}

// ─── POST /api/recommendations ────────────────────────────────────────────────
// Hybrid endpoint — accepts IntentContext + optional query terms for full personalisation.

interface RecommendationRequest {
  context?: Partial<IntentContext>;
  queryTerms?: string[];
  rawQuery?: string;
  limit?: number;
}

export async function POST(req: NextRequest) {
  let body: RecommendationRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const limit = Math.min(Math.max(1, body.limit ?? DEFAULT_LIMIT), MAX_LIMIT);

  // Build query terms from explicit list or raw query string
  let queryTerms: string[] = body.queryTerms ?? [];
  if (!queryTerms.length && body.rawQuery?.trim()) {
    queryTerms = tokenize(body.rawQuery.trim());
  }
  // If still empty, fall back to server-side event store
  if (!queryTerms.length) {
    const store = getEventStore();
    queryTerms = aggregateTerms(store.slice(-20));
  }

  const context: IntentContext = {
    viewedSlugs:          body.context?.viewedSlugs           ?? [],
    categoryAffinities:   body.context?.categoryAffinities    ?? {},
    complementCategories: body.context?.complementCategories  ?? [],
    sizePref:             body.context?.sizePref,
    excludeSlugs:         body.context?.excludeSlugs          ?? [],
  };

  const products = MOCK_PRODUCTS.filter((p) => p.status === 'active');
  const ranked = hybridRank(products, context, queryTerms, limit);

  return NextResponse.json({
    terms: queryTerms,
    results: ranked.map((r) => ({ product: r.product, score: r.score, matchedTerms: r.matchedTerms })),
    count: ranked.length,
  });
}
