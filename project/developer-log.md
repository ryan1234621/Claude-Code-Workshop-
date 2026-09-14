# Parmore — Developer Log

## Project Overview

**Parmore** is an athletic luxury golf apparel and headwear e-commerce platform built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, and Supabase.

---

## Part 1 — Foundation, Schema & Storefront

**Branch:** `claude/confident-hawking-jgchwm`

### Completed

#### Infrastructure & Configuration
- `package.json` — dependencies pinned: Next.js 14.2.5, Framer Motion 11, Supabase JS 2, lucide-react, clsx/tailwind-merge
- `next.config.js` — remote image patterns for Unsplash + Supabase CDN
- `tailwind.config.ts` — full brand palette (`parmore-*`), serif/sans font vars, custom keyframes, luxury shadows, spacing tokens
- `postcss.config.js` + `tsconfig.json`

#### Database (Supabase)
- `app/supabase/migrations.sql` — complete schema with:
  - ENUM types: `product_category`, `product_status`, `order_status`, `discount_type`
  - Tables: `profiles`, `products`, `collections`, `reviews`, `addresses`, `orders`, `wishlist`, `promotions`
  - Auto-create profile trigger on `auth.users` insert
  - `updated_at` auto-update triggers
  - Full-text search indexes on products
  - Single-default-address enforcement trigger
  - Row Level Security (RLS) policies for all tables
  - Seed data: 6 products, 3 collections

#### TypeScript Types (`app/lib/types.ts`)
- Complete interfaces: `Product`, `ProductVariant`, `ProductColor`, `ProductSize`, `Collection`
- Commerce: `Cart`, `CartItem`, `Order`, `OrderItem`, `OrderStatus`
- User: `UserProfile`, `Address`, `WishlistItem`, `Review`
- UI: `FilterState`, `SortOption`, `NavItem`, `HeroBanner`, `Promotion`

#### Utilities (`app/lib/utils.ts`)
- `cn()` — Tailwind class merging
- `formatPriceRaw()` / `formatPrice()` — currency formatting
- `discountPercent()` — sale percentage calculation
- `getProductBadge()` — badge label logic (New / Best Seller / % Off)
- `getAvailableColors()` / `getAvailableSizes()` — variant helpers
- `calcCartTotals()` / `freeShippingRemaining()` — cart math
- Date helpers, string helpers, order status color mapping

#### Supabase Client (`app/lib/supabaseClient.ts`)
- Typed browser client with `Database` generic
- `fetchProducts()` with filter options
- `fetchProductBySlug()`, `fetchCollections()`, `fetchReviews()`
- `app/lib/database.types.ts` — generated DB interface

#### Mock Data (`app/lib/mockData.ts`)
- 6 fully hydrated products with variants, colors, sizes, images
- 3 featured collections
- Used for development before Supabase connection

#### Cart System (`components/CartProvider.tsx`)
- React Context + useReducer pattern
- Actions: ADD_ITEM, REMOVE_ITEM, UPDATE_QUANTITY, CLEAR_CART, OPEN/CLOSE
- Deduplication logic — increments quantity for matching variant+size
- `useCart()` hook

#### UI Components
- `Button.tsx` — 5 variants (primary, secondary, ghost, outline, gold), 4 sizes, loading state
- `Badge.tsx` — 6 variants (default, new, sale, bestseller, gold, outline)
- `Select.tsx` — accessible select with label, error, and custom chevron

#### Navbar (`components/Navbar.tsx`)
- Transparent on home hero, solid on scroll
- Animated dropdown for "Shop" link
- Search bar expand/collapse animation
- Mobile slide-in drawer
- Cart badge with animated count
- Highlights active route

#### Footer (`components/Footer.tsx`)
- Clubhouse-aesthetic dark footer
- Newsletter signup input
- 4-column grid: Brand, Shop, Company, Support
- Social links (Instagram, X, YouTube)
- Bottom legal bar

#### ProductCard (`components/ProductCard.tsx`)
- Framer Motion scroll-triggered entrance animation
- Hover image swap (2nd image on hover)
- Hover scale + overlay + quick action buttons
- Wishlist toggle with heart animation
- Color swatch dots
- Badge rendering (New, Best Seller, Sale)

#### CartDrawer (`components/CartDrawer.tsx`)
- Framer Motion slide-in from right
- Backdrop with blur
- Free shipping progress bar
- Line item management (qty inc/dec, remove)
- Animated item entrance/exit
- Order summary + checkout CTA
- Empty state with CTA

#### Pages
- **`app/page.tsx`** (Home) — Hero (full-bleed, parallax-ready), Brand Pillars, Featured Collections 3-up grid, Best Sellers 4-up, New Arrivals, Brand Story banner
- **`app/shop/page.tsx`** (Catalog) — Category + price filters, mobile filter drawer, sort dropdown, grid/list view toggle, active filter chips with clear
- **`app/shop/[slug]/page.tsx`** (PDP) — Image gallery with thumbnails + dot nav, color swatch selector, size selector with OOS states, quantity picker, Add to Bag with cart integration, wishlist, trust signals, accordion for details/care/fit/shipping, related products

#### Global Styles (`app/globals.css`)
- Tailwind base + component + utilities
- CSS custom properties (brand colors, font vars, navbar height, transition)
- Typography scale classes (`display-1/2`, `heading-1/2`, `label-caps`)
- Gold underline hover effect, shimmer text effect
- Skeleton shimmer animation
- `container-parmore` responsive container

---

## Architecture Notes

- **Cart state** lives in React Context (client-side only). For production, persist to `localStorage` or sync with a Supabase cart table.
- **Mock data** in `app/lib/mockData.ts` mirrors the Supabase schema exactly, enabling easy swap to live queries.
- **Images** use `next/image` with `fill` + `sizes` props throughout for optimized delivery.
- **RLS** is enabled on all tables. Admin writes require a service role key — never expose in the browser.

---

## Next Steps (Parts 2+)

- Auth flow (signup / login / profile)
- Checkout with Stripe integration
- Order management dashboard
- Admin panel (product CRUD)
- Review submission flow
- Wishlist persistence
- Search with Supabase full-text

---

## Part 2 — Customer Portal, Order Lifecycle & Realtime Support (Build Log)

### Date
2026-09-12

### Scope
Customer-facing self-service portal: profile/settings, order history with post-purchase workflows, and an integrated real-time support chat system.

---

### New Files

#### Types (`app/lib/types.ts` — additions)
- `TicketStatus`: `'open' | 'in_review' | 'actioned' | 'resolved' | 'closed'`
- `TicketCategory`: 7 categories (order_issue, return_request, exchange, product_question, shipping, billing, other)
- `ReturnStatus` / `ReturnReason`: enums mirroring DB
- `SupportTicket`, `TicketMessage`, `ReturnItem`, `ReturnRequest`, `TicketNotification`

#### Utils (`app/lib/utils.ts` — additions)
- `ticketStatusConfig(status)` → `{label, bg, text, dot}` for consistent badge rendering
- `returnStatusConfig(status)` → same pattern for return status
- `ticketCategoryLabel(cat)` → human-readable category string
- `relativeTime(iso)` → "2 hours ago" / "just now" etc.

#### Supabase Client (`app/lib/supabaseClient.ts` — additions)
- `fetchProfile()`, `updateProfile()`, `fetchOrders()`, `fetchTickets()`, `fetchTicket()`
- `createTicket()`, `fetchTicketMessages()`, `sendTicketMessage()`
- `fetchReturnRequests()`, `createReturnRequest()`
- `fetchNotifications()`, `markNotificationsRead()`
- `subscribeToTicketMessages(ticketId, onMessage)` — Supabase Realtime `postgres_changes` channel on `ticket_messages`
- `subscribeToTicketStatus(ticketId, onUpdate)` — Realtime UPDATE on `support_tickets`

#### Mock Data (`app/lib/mockData.ts` — additions)
- `MOCK_USER` — Alex Morgan, `mock-user-001`
- `MOCK_ORDERS` — 3 orders across `delivered`, `shipped`, `processing` statuses
- `MOCK_TICKETS` — 3 tickets across categories/statuses
- `MOCK_TICKET_MESSAGES` — keyed by ticket ID, includes system messages + agent replies
- `MOCK_RETURNS` — 1 approved return request

#### Database Migrations (`app/supabase/migrations.sql` — appended)
- ENUMs: `ticket_status`, `ticket_category`, `return_status`, `return_reason`
- Tables: `support_tickets`, `ticket_messages`, `return_requests`, `ticket_notifications`
- Auto-triggers: `handle_ticket_status_transition()`, `notify_customer_on_agent_reply()`
- RLS policies on all 4 new tables
- Supabase Realtime publication: `ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages, support_tickets, ticket_notifications`

#### Components
- **`components/TicketStatusBadge.tsx`** — `TicketStatusBadge` (inline colored pill), `AnimatedTicketStatus` (entrance animation), `TicketStatusProgress` (5-step progress bar with connecting lines)
- **`components/SettingsForm.tsx`** — contact info + shipping address form with SaveState (`idle|saving|success|error`) animated feedback, email/required validation
- **`components/OrderCard.tsx`** — expandable order card with 5-step tracking progress, item checkboxes for return selection, action buttons for dispute/return (delivered orders only)
- **`components/CreateTicketModal.tsx`** — dual-mode modal: `'ticket'` (general support with category select) and `'return'` (item selection + return reason); framer-motion backdrop + modal animation
- **`components/TicketChat.tsx`** — optimistic update chat with: `pendingIds` ref to prevent realtime duplicates, `MessageBubble` (system strip / agent navy / own black), `TypingIndicator` (3 bouncing dots), date-grouped message feed, auto-resize textarea, Enter-to-send

#### Pages
- **`app/account/layout.tsx`** — tabbed shell (Profile / Orders / Support) with framer-motion `layoutId` sliding gold underline, account header, breadcrumb
- **`app/account/page.tsx`** — QuickStats grid (orders, spend, tickets) + RecentOrders preview + SettingsForm
- **`app/account/orders/page.tsx`** — status filter chips (All/Processing/Shipped/Delivered/Cancelled), staggered list animation, CreateTicketModal wired for both ticket and return flows
- **`app/account/tickets/page.tsx`** — ticket list with status filter chips, "Open Ticket" CTA, staggered animation, empty state with first-ticket prompt
- **`app/account/tickets/[id]/page.tsx`** — ticket detail: header card with subject/status/category/open date, `TicketStatusProgress`, attached order panel, full `TicketChat` (480px fixed height, realtime-ready)

---

### Architecture Notes — Part 2

- **Realtime pattern**: `TicketChat` accepts `onSubscribe` as a prop, abstracting the Supabase channel. The mock passes `undefined` (no-op); production wires `subscribeToTicketMessages`. This makes the component fully testable without a live DB.
- **Optimistic UI + dedup**: Outgoing messages are added immediately with a temp ID. On server confirm, the temp message is replaced. `pendingIds` ref prevents the realtime INSERT event from duplicating the confirmed message.
- **Dual-mode modal**: `CreateTicketModal` handles both general tickets and return requests via a `mode` prop. Return mode renders item checkboxes and a return reason select; ticket mode shows a category select. Subject is auto-filled when an order is attached.
- **Post-purchase actions**: The `OrderCard` renders "Get Help" and "Start Return / Return N Items" actions only for `delivered` orders. Item-level return pre-selects specific items in the modal.

---

### Next Steps (Parts 3+)

- Supabase Auth integration (replace MOCK_USER with session.user)
- Checkout flow with Stripe
- Admin panel: ticket queue, agent reply interface
- Order tracking webhook integration (carrier APIs)
- Push/email notifications via ticket_notifications table
- Review submission from delivered order items

---

## Part 3 — Search Logging, Recommendation Algorithm & Floating Drawer (Build Log)

### Date
2026-09-14

### Scope
Client-side and server-side search intent tracking, a custom scoring recommendation engine, and an interactive slide-over recommendation drawer with a full-featured search modal.

---

### Algorithm Design

#### Scoring Weights (`app/lib/recommendationEngine.ts`)

| Signal | Weight | Rationale |
|---|---|---|
| Category match | 4.0 | Strongest explicit intent signal |
| Subcategory match | 2.5 | More specific than category |
| Tag overlap | 3.0 | Curated editorial signals |
| Name token match | 2.0 | High precision — user likely searching product name |
| Description token match | 0.5 | Lower weight — broad semantic overlap |
| Best seller bonus | 1.0 | Social proof tiebreaker |
| New arrival bonus | 0.8 | Editorial freshness signal |
| On sale bonus | 0.5 | Deal discovery intent |
| Featured bonus | 0.3 | Weak editorial signal |

**Why not TF-IDF or embeddings?**
The catalog is small (O(100) SKUs) and fully structured. A weighted rule-based scorer is fully explainable, zero-latency, runs on the edge, and is trivially tunable without model retraining. Embeddings are reserved for a future semantic search upgrade when the catalog exceeds ~1,000 SKUs.

#### Synonym Expansion
Query terms are expanded before scoring using a golf-domain synonym map (e.g. "shirt" → ["apparel", "polo", "top"]). This prevents empty-result scenarios for common vocabulary mismatches.

#### Recency Decay
When using aggregated history for implicit recommendations, each session's terms are weighted by a half-life of 24 hours:
`weight = e^(-0.693 × ageHours / 24)`
Terms from 7 days ago contribute ~0.25× relative to today's searches.

---

### New Files

#### `app/lib/searchHistory.ts`
- `SearchEvent { query, terms, timestamp, page? }` — stored in `localStorage` under `parmore_search_history`
- `appendEvent()` — deduplicates within a 5-minute window, caps at 50 events
- `getTopTerms(n)` — returns n most-frequent terms across history
- `getRecentQueries(n)` — returns n most-recent unique display queries

#### `app/lib/recommendationEngine.ts`
- `STOP_WORDS` — common English stop words to filter before scoring
- `SYNONYMS` — golf-domain synonym expansion map
- `tokenize(text)` — lowercases, strips punctuation, removes stop words, expands synonyms
- `scoreProduct(product, terms)` → `ScoredProduct { product, score, matchedTerms }`
- `rankProducts(products, terms, n)` → top-n sorted by score
- `aggregateTerms(sessions)` → recency-weighted term list from multiple sessions

#### `app/api/search-events/route.ts`
- `POST` — accepts `{ query, page? }`, tokenizes, appends to rolling in-memory store (500 cap)
- Exports `getEventStore()` for server-side consumption by recommendations route
- Production path: `INSERT INTO search_events (session_id, query, terms, page)`

#### `app/api/recommendations/route.ts`
- `GET ?terms=...&limit=6` — explicit terms from client take priority
- Falls back to implicit personalization from server-side event store
- Scores `MOCK_PRODUCTS` via `rankProducts()`, returns `{ terms, results, count }`
- Production path: replaces mock catalog with `SELECT * FROM products WHERE status = 'active'`

#### `components/RecommendedProductCard.tsx`
- Compact 3-column layout: thumbnail | name+price+matched terms | quick-add button
- Optimistic "Add to Bag" via `CartProvider.dispatch`
- Success state: button turns green with ✓ for 2 seconds
- Hover: image scale-105 + gold border reveal

#### `components/RecommendedDrawer.tsx`
- Floating "For You" pill button (fixed bottom-right, z-40), hides while drawer is open
- Slide-over from right via spring animation (stiffness 380, damping 38)
- On open: reads `getTopTerms()` from localStorage and calls `/api/recommendations`
- States: loading (spinner), error (with retry), empty (prompt to search), results
- Body scroll lock while open, Escape to close, backdrop click to close

#### `components/SearchModal.tsx`
- Cmd+K / Ctrl+K global keyboard shortcut (registered in Navbar)
- Opens above navbar (top: calc(--navbar-height + 16px))
- Debounced search logging: 800ms after user stops typing → `appendEvent` + `POST /api/search-events`
- Client-side product filtering via `tokenize()` — real-time, no network call
- Results grouped by category with section headers
- Recent searches (chip row) and quick-start suggestions when empty
- "View all results" footer link → `/shop?q=...`

#### `components/Navbar.tsx` (updated)
- Replaced inline search bar with `<SearchModal>` rendered outside the sticky header
- Cmd+K listener added to Navbar's effect suite
- Search button updated: shows `⌘K` badge on desktop for discoverability

---

### Database (`app/supabase/migrations.sql` — appended)
- `search_events` table with `user_id`, `session_id`, `query`, `terms[]`, `page`, `result_count`
- `idx_search_events_session_created` — fast per-session event lookup
- `idx_search_events_user_created` — user-level personalization
- `idx_search_events_terms_gin` — GIN index for `terms @> '{polo}'` style containment queries
- `idx_products_tags_gin` — GIN index on product tags array
- `idx_products_status_featured` / `status_bestseller` / `status_new_arrival` — composite indexes for editorial filtering
- `mv_top_search_terms` materialized view — precomputed top-200 terms over last 7 days (refresh via pg_cron in production)

---

### Architecture Notes — Part 3

- **Dual storage**: search events are written to both `localStorage` (client, zero-latency) and `/api/search-events` (server, for cross-session aggregation). The API is non-blocking (fire-and-forget).
- **Edge-ready**: The recommendation engine is a pure function with no I/O. It can run in a Next.js Edge Runtime function without cold-start penalty.
- **No tracking IDs**: Guest sessions use only `window.location.pathname` and the query. No cookies or fingerprinting are set client-side.
- **Testability**: `scoreProduct`, `tokenize`, and `rankProducts` are pure functions with no side effects — unit-testable without mocking.

---

### Next Steps (Part 4+)
- Checkout flow with Stripe
- Auth integration — persist `search_events` with `user_id` post-login
- Refresh `mv_top_search_terms` via pg_cron + expose in admin
- Semantic search upgrade with pgvector embeddings for catalog > 1,000 SKUs
