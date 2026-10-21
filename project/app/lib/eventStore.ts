import { tokenize } from '@/app/lib/recommendationEngine';

// In-memory event store for the demo. In production, replace with:
//   INSERT INTO search_events (user_id, session_id, query, terms, page)
// The Supabase table (migrations.sql) is already set up for this.
const MAX_STORE_SIZE = 500;

export interface SearchEvent {
  query: string;
  terms: string[];
  timestamp: string;
  page?: string;
}

const eventStore: SearchEvent[] = [];

// Read the store server-side (used by /api/recommendations and /api/track-view).
export function getEventStore(): SearchEvent[] {
  return eventStore;
}

// Push an event, keeping a rolling window of MAX_STORE_SIZE entries.
export function pushEvent(event: SearchEvent): void {
  eventStore.push(event);
  if (eventStore.length > MAX_STORE_SIZE) eventStore.shift();
}

// Append a pre-built event (used by /api/track-view).
export function appendEvent(event: { query: string; timestamp: string }): void {
  pushEvent({ query: event.query, terms: tokenize(event.query), timestamp: event.timestamp });
}
