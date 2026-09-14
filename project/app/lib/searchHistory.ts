// Client-side search session storage for guest users.
// Mirrors the shape we'd write to Supabase for authenticated users.

const STORAGE_KEY = 'parmore_search_history';
const MAX_EVENTS = 50;
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export interface SearchEvent {
  query: string;
  terms: string[];
  timestamp: string;
  page?: string;
}

// ─── Read / Write ─────────────────────────────────────────────────────────────

export function readHistory(): SearchEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendEvent(event: SearchEvent): void {
  if (typeof window === 'undefined') return;
  try {
    const history = readHistory();
    const cutoff = Date.now() - DEDUP_WINDOW_MS;

    // Don't append if same query was recorded in the last 5 minutes
    const isDuplicate = history.some(
      (e) => e.query === event.query && new Date(e.timestamp).getTime() > cutoff
    );
    if (isDuplicate) return;

    const updated = [event, ...history].slice(0, MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be blocked in private browsing
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    //
  }
}

// ─── Analytics Helpers ────────────────────────────────────────────────────────

/** Returns the n most-frequently searched terms across the stored history. */
export function getTopTerms(n = 10): string[] {
  const events = readHistory();
  const freq = new Map<string, number>();

  for (const event of events) {
    for (const term of event.terms) {
      freq.set(term, (freq.get(term) ?? 0) + 1);
    }
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([term]) => term);
}

/** Returns the n most-recent unique queries (display-friendly). */
export function getRecentQueries(n = 5): string[] {
  const events = readHistory();
  const seen = new Set<string>();
  const result: string[] = [];

  for (const event of events) {
    const key = event.query.toLowerCase().trim();
    if (!seen.has(key) && event.query.trim()) {
      seen.add(key);
      result.push(event.query.trim());
    }
    if (result.length >= n) break;
  }

  return result;
}
