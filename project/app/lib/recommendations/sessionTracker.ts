// Client-side guest intent tracker stored in localStorage.
// Records product views, infers category affinities and size preference,
// and produces an IntentContext for the hybrid recommendation engine.
// All reads are guarded for SSR safety and private-browsing graceful fallback.

import type { IntentContext } from './scoringMatrix';

const STORAGE_KEY = 'parmore_view_history';
const MAX_VIEWS = 40;
const DEDUP_WINDOW_MS = 3 * 60 * 1000; // don't re-record same product within 3 min

export interface ViewEvent {
  slug: string;
  category: string;
  subcategory?: string;
  tags: string[];
  sizePref?: string;   // size the user was interacting with (if known)
  timestamp: string;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function readViews(): ViewEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeViews(views: ViewEvent[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
  } catch {
    // localStorage blocked in private browsing — silently ignore
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Records that the user viewed (or spent time on) a product. */
export function trackProductView(event: Omit<ViewEvent, 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  const views = readViews();
  const cutoff = Date.now() - DEDUP_WINDOW_MS;

  // Dedup: don't append if same slug was seen recently
  const isRecent = views.some(
    (v) => v.slug === event.slug && new Date(v.timestamp).getTime() > cutoff
  );
  if (isRecent) return;

  const updated: ViewEvent[] = [
    { ...event, timestamp: new Date().toISOString() },
    ...views,
  ].slice(0, MAX_VIEWS);

  writeViews(updated);
}

/** Updates the size preference on the most recent view of a slug. */
export function updateSizePref(slug: string, size: string): void {
  if (typeof window === 'undefined') return;
  const views = readViews();
  const updated = views.map((v) =>
    v.slug === slug ? { ...v, sizePref: size } : v
  );
  writeViews(updated);
}

/** Returns the last n viewed product slugs (most recent first). */
export function getRecentSlugs(n = 10): string[] {
  return readViews()
    .slice(0, n)
    .map((v) => v.slug);
}

/**
 * Derives an IntentContext from the view history.
 *
 * Category affinities are computed with a 24-hour half-life decay —
 * a product viewed 6 hours ago contributes more than one viewed 3 days ago.
 *
 * Size preference is the most frequently interacted-with size.
 */
export function getIntentContext(opts: {
  complementCategories?: string[];
  excludeSlugs?: string[];
} = {}): IntentContext {
  const views = readViews();

  // --- Category affinity with recency decay ---
  const affinities: Record<string, number> = {};
  const HALF_LIFE_HOURS = 24;

  for (const view of views) {
    const ageHours = (Date.now() - new Date(view.timestamp).getTime()) / 3_600_000;
    const weight = Math.exp((-0.693 * ageHours) / HALF_LIFE_HOURS);
    affinities[view.category] = (affinities[view.category] ?? 0) + weight;
  }

  // Normalise to 0–3 scale
  const maxAffinity = Math.max(...Object.values(affinities), 1);
  for (const key of Object.keys(affinities)) {
    affinities[key] = (affinities[key] / maxAffinity) * 3;
  }

  // --- Size preference: most frequently occurring non-null sizePref ---
  const sizeFreq: Record<string, number> = {};
  for (const view of views) {
    if (view.sizePref) {
      sizeFreq[view.sizePref] = (sizeFreq[view.sizePref] ?? 0) + 1;
    }
  }
  const sizePref = Object.entries(sizeFreq).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    viewedSlugs: views.map((v) => v.slug),
    categoryAffinities: affinities,
    complementCategories: opts.complementCategories,
    sizePref,
    excludeSlugs: opts.excludeSlugs,
  };
}

export function clearViewHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    //
  }
}
