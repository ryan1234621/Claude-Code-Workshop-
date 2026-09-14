import { NextRequest, NextResponse } from 'next/server';
import { tokenize, rankProducts, aggregateTerms } from '@/app/lib/recommendationEngine';
import { MOCK_PRODUCTS } from '@/app/lib/mockData';
import { getEventStore } from '@/app/api/search-events/route';

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 20;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Accept explicit terms from the client (comma or space separated)
  const rawTerms = searchParams.get('terms') ?? '';
  // Optionally restrict result count
  const limitParam = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
  const limit = Math.min(Math.max(1, limitParam), MAX_LIMIT);

  // Build the working set of query terms
  let queryTerms: string[];

  if (rawTerms.trim()) {
    // Client passed explicit terms — tokenize them directly
    queryTerms = tokenize(rawTerms);
  } else {
    // Fall back to server-side event store for implicit personalization
    const store = getEventStore();
    const sessions = store.slice(-20); // last 20 events for freshness
    queryTerms = aggregateTerms(sessions);
  }

  // In production: fetch real product catalog from Supabase
  //   const { data: products } = await supabase.from('products').select('*').eq('status', 'active');
  const products = MOCK_PRODUCTS.filter((p) => p.status === 'active');

  const ranked = rankProducts(products, queryTerms, limit);

  return NextResponse.json({
    terms: queryTerms,
    results: ranked.map((r) => ({
      product: r.product,
      score: r.score,
      matchedTerms: r.matchedTerms,
    })),
    count: ranked.length,
  });
}
