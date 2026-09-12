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
