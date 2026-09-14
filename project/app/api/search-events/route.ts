import { NextRequest, NextResponse } from 'next/server';
import { tokenize } from '@/app/lib/recommendationEngine';

// In-memory event store for the demo. In production, replace with:
//   INSERT INTO search_events (user_id, session_id, query, terms, page)
// The Supabase table (migrations.sql) is already set up for this.
const MAX_STORE_SIZE = 500;
const eventStore: Array<{
  query: string;
  terms: string[];
  timestamp: string;
  page?: string;
}> = [];

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

  eventStore.push(event);
  if (eventStore.length > MAX_STORE_SIZE) eventStore.shift(); // rolling window

  return NextResponse.json({ success: true, terms }, { status: 200 });
}

// Export the store so the recommendations route can read it server-side.
export function getEventStore() {
  return eventStore;
}
