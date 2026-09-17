import { NextRequest, NextResponse } from 'next/server';
import { getEventStore, appendEvent } from '@/app/api/search-events/route';

export interface TrackViewPayload {
  slug: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  query?: string;
}

// ─── POST /api/track-view ─────────────────────────────────────────────────────
// Ingests a product-view event server-side so the recommendation engine can
// use it when building context for users without a localStorage history.

export async function POST(req: NextRequest) {
  let body: TrackViewPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.slug || !body.category) {
    return NextResponse.json({ error: 'slug and category are required' }, { status: 422 });
  }

  // Append relevant terms to the server-side event store so the GET
  // /api/recommendations fallback path picks them up.
  const terms: string[] = [
    body.category,
    ...(body.subcategory ? [body.subcategory] : []),
    ...(body.tags ?? []),
    ...(body.query ? body.query.split(/\s+/).filter(Boolean) : []),
  ];

  if (terms.length) {
    appendEvent({ query: terms.join(' '), timestamp: new Date().toISOString() });
  }

  return NextResponse.json({ ok: true, recorded: terms.length });
}
