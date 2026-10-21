import { NextRequest, NextResponse } from 'next/server';
import { tokenize } from '@/app/lib/recommendationEngine';
import { pushEvent } from '@/app/lib/eventStore';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || !('query' in body)) {
    return NextResponse.json({ error: 'Missing required field: query' }, { status: 422 });
  }

  const { query, page } = body as { query?: unknown; page?: unknown };

  if (typeof query !== 'string' || !query.trim()) {
    return NextResponse.json({ error: 'query must be a non-empty string' }, { status: 422 });
  }

  const trimmed = query.trim().slice(0, 200); // guard against oversized payloads
  const terms = tokenize(trimmed);

  const event = {
    query: trimmed,
    terms,
    timestamp: new Date().toISOString(),
    page: typeof page === 'string' ? page : undefined,
  };

  pushEvent(event);

  return NextResponse.json({ success: true, terms }, { status: 200 });
}
