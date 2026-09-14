-- ============================================================
-- PARMORE E-COMMERCE — COMPLETE DATABASE SCHEMA
-- Single idempotent migration: extensions → types → tables →
-- indexes → triggers/functions → RLS → realtime → seed data
-- ============================================================

-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── ENUM TYPES ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE product_category AS ENUM ('apparel', 'headwear', 'accessories');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('active', 'draft', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open', 'in_review', 'actioned', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_category AS ENUM (
    'order_issue', 'return_request', 'exchange', 'product_question', 'shipping', 'billing', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE return_status AS ENUM (
    'requested', 'approved', 'rejected', 'shipped_back', 'received', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE return_reason AS ENUM (
    'wrong_size', 'wrong_item', 'defective', 'not_as_described', 'changed_mind', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM (
    'master_admin', 'support_agent', 'catalog_manager', 'analytics_viewer'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── SHARED TRIGGER FUNCTION (update updated_at) ─────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── PROFILES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  category          product_category NOT NULL,
  subcategory       TEXT,
  price             NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price  NUMERIC(10, 2) CHECK (compare_at_price >= 0),
  images            TEXT[] NOT NULL DEFAULT '{}',
  variants          JSONB NOT NULL DEFAULT '[]',
  tags              TEXT[] NOT NULL DEFAULT '{}',
  status            product_status NOT NULL DEFAULT 'draft',
  featured          BOOLEAN NOT NULL DEFAULT false,
  best_seller       BOOLEAN NOT NULL DEFAULT false,
  new_arrival       BOOLEAN NOT NULL DEFAULT false,
  materials         TEXT,
  care_instructions TEXT,
  fit_guide         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_name_fts_idx
  ON products USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS products_tags_gin_idx
  ON products USING GIN (tags);
CREATE INDEX IF NOT EXISTS products_category_status_idx
  ON products (category, status);
CREATE INDEX IF NOT EXISTS products_status_featured_idx
  ON products (status, featured, created_at DESC);
CREATE INDEX IF NOT EXISTS products_status_bestseller_idx
  ON products (status, best_seller)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS products_status_new_arrival_idx
  ON products (status, new_arrival)
  WHERE status = 'active';

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── COLLECTIONS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS collections (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  image        TEXT NOT NULL DEFAULT '',
  product_ids  UUID[] NOT NULL DEFAULT '{}',
  featured     BOOLEAN NOT NULL DEFAULT false,
  season       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS collections_featured_idx ON collections (featured);

-- ─── REVIEWS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name         TEXT NOT NULL,
  rating            SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title             TEXT NOT NULL DEFAULT '',
  body              TEXT NOT NULL DEFAULT '',
  verified_purchase BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews (product_id);

-- ─── ADDRESSES ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS addresses (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  line1      TEXT NOT NULL,
  line2      TEXT,
  city       TEXT NOT NULL,
  state      TEXT NOT NULL,
  zip        TEXT NOT NULL,
  country    TEXT NOT NULL DEFAULT 'US',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS addresses_user_idx ON addresses (user_id);

CREATE OR REPLACE FUNCTION enforce_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS single_default_address ON addresses;
CREATE TRIGGER single_default_address
  AFTER INSERT OR UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION enforce_single_default_address();

-- ─── ORDERS ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number     TEXT NOT NULL UNIQUE
    DEFAULT ('ORD-' || upper(substring(gen_random_uuid()::text, 1, 8))),
  user_id          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  items            JSONB NOT NULL DEFAULT '[]',
  shipping_address JSONB NOT NULL DEFAULT '{}',
  status           order_status NOT NULL DEFAULT 'pending',
  subtotal         NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost    NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  tax              NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total            NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  tracking_number  TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_idx       ON orders (user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx     ON orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── WISHLIST ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wishlist (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS wishlist_user_idx ON wishlist (user_id);

-- ─── PROMOTIONS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS promotions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code           TEXT NOT NULL UNIQUE,
  description    TEXT NOT NULL DEFAULT '',
  discount_type  discount_type NOT NULL,
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order      NUMERIC(10, 2),
  max_uses       INTEGER,
  uses           INTEGER NOT NULL DEFAULT 0,
  expires_at     TIMESTAMPTZ,
  active         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── SUPPORT TICKETS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_tickets (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number  TEXT NOT NULL UNIQUE
    DEFAULT ('TKT-' || upper(substring(gen_random_uuid()::text, 1, 6))),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id       UUID REFERENCES orders(id) ON DELETE SET NULL,
  subject        TEXT NOT NULL,
  category       ticket_category NOT NULL DEFAULT 'other',
  status         ticket_status NOT NULL DEFAULT 'open',
  priority       SMALLINT NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  assigned_agent UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at    TIMESTAMPTZ,
  closed_at      TIMESTAMPTZ,
  metadata       JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tickets_user_idx       ON support_tickets (user_id);
CREATE INDEX IF NOT EXISTS tickets_status_idx     ON support_tickets (status);
CREATE INDEX IF NOT EXISTS tickets_order_idx      ON support_tickets (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS tickets_created_at_idx ON support_tickets (created_at DESC);

DROP TRIGGER IF EXISTS support_tickets_updated_at ON support_tickets;
CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION handle_ticket_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status <> 'resolved' THEN
    NEW.resolved_at = now();
  END IF;
  IF NEW.status = 'closed' AND OLD.status <> 'closed' THEN
    NEW.closed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ticket_status_transition ON support_tickets;
CREATE TRIGGER ticket_status_transition
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION handle_ticket_status_transition();

-- ─── TICKET MESSAGES ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  is_agent    BOOLEAN NOT NULL DEFAULT false,
  is_system   BOOLEAN NOT NULL DEFAULT false,
  attachments TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticket_messages_ticket_idx
  ON ticket_messages (ticket_id, created_at ASC);

-- ─── RETURN REQUESTS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS return_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_number   TEXT NOT NULL UNIQUE
    DEFAULT ('RET-' || upper(substring(gen_random_uuid()::text, 1, 6))),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  ticket_id       UUID REFERENCES support_tickets(id) ON DELETE SET NULL,
  items           JSONB NOT NULL DEFAULT '[]',
  reason          return_reason NOT NULL,
  notes           TEXT,
  status          return_status NOT NULL DEFAULT 'requested',
  refund_amount   NUMERIC(10, 2),
  return_label    TEXT,
  tracking_number TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS returns_user_idx   ON return_requests (user_id);
CREATE INDEX IF NOT EXISTS returns_order_idx  ON return_requests (order_id);
CREATE INDEX IF NOT EXISTS returns_status_idx ON return_requests (status);

DROP TRIGGER IF EXISTS return_requests_updated_at ON return_requests;
CREATE TRIGGER return_requests_updated_at
  BEFORE UPDATE ON return_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── TICKET NOTIFICATIONS ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticket_id  UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticket_notifications_user_idx
  ON ticket_notifications (user_id, read);

CREATE OR REPLACE FUNCTION notify_customer_on_agent_reply()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_agent THEN
    INSERT INTO ticket_notifications (user_id, ticket_id, message)
    SELECT t.user_id,
           NEW.ticket_id,
           'Support replied to your ticket #' || t.ticket_number
    FROM support_tickets t
    WHERE t.id = NEW.ticket_id
      AND t.user_id <> COALESCE(NEW.sender_id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_agent_message ON ticket_messages;
CREATE TRIGGER on_agent_message
  AFTER INSERT ON ticket_messages
  FOR EACH ROW EXECUTE FUNCTION notify_customer_on_agent_reply();

-- ─── SEARCH EVENTS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS search_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  session_id   TEXT        NOT NULL,
  query        TEXT        NOT NULL CHECK (char_length(query) BETWEEN 1 AND 200),
  terms        TEXT[]      NOT NULL DEFAULT '{}',
  page         TEXT,
  result_count INT         DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_events_session_created
  ON search_events (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_events_user_created
  ON search_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_search_events_terms_gin
  ON search_events USING GIN (terms);

-- ─── ADMIN USERS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_users (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT        NOT NULL UNIQUE,
  full_name       TEXT        NOT NULL,
  role            admin_role  NOT NULL DEFAULT 'support_agent',
  scopes          TEXT[]      NOT NULL DEFAULT '{}',
  avatar_initials TEXT        NOT NULL DEFAULT '',
  last_active_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION derive_admin_initials()
RETURNS TRIGGER AS $$
BEGIN
  NEW.avatar_initials := upper(
    substring(split_part(NEW.full_name, ' ', 1), 1, 1) ||
    substring(split_part(NEW.full_name, ' ', 2), 1, 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS admin_users_initials ON admin_users;
CREATE TRIGGER admin_users_initials
  BEFORE INSERT OR UPDATE OF full_name ON admin_users
  FOR EACH ROW EXECUTE FUNCTION derive_admin_initials();

-- ─── ADMIN AUDIT LOG ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id            BIGSERIAL   PRIMARY KEY,
  admin_id      UUID        NOT NULL REFERENCES admin_users(id),
  action        TEXT        NOT NULL,
  resource_type TEXT        NOT NULL,
  resource_id   TEXT        NOT NULL,
  payload       JSONB       DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_created
  ON admin_audit_log (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_resource
  ON admin_audit_log (resource_type, resource_id, created_at DESC);

-- ─── SCOPE VALIDATION HELPER ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION has_admin_scope(scope text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
      AND scope = ANY(scopes)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── MATERIALIZED VIEW: TOP SEARCH TERMS ─────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_search_terms AS
SELECT
  term,
  count(*)            AS frequency,
  max(se.created_at)  AS last_seen
FROM search_events se,
     LATERAL unnest(se.terms) AS term
WHERE se.created_at >= now() - INTERVAL '7 days'
GROUP BY term
ORDER BY frequency DESC
LIMIT 200;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_top_search_terms_term
  ON mv_top_search_terms (term);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist          ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log   ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can view own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Products — public read, admin write
DROP POLICY IF EXISTS "Anyone can view active products"     ON products;
DROP POLICY IF EXISTS "Catalog managers can insert products" ON products;
DROP POLICY IF EXISTS "Catalog managers can update products" ON products;
DROP POLICY IF EXISTS "Catalog managers can delete products" ON products;
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT USING (status = 'active');
CREATE POLICY "Catalog managers can insert products"
  ON products FOR INSERT WITH CHECK (has_admin_scope('products:write'));
CREATE POLICY "Catalog managers can update products"
  ON products FOR UPDATE
  USING (has_admin_scope('products:write'))
  WITH CHECK (has_admin_scope('products:write'));
CREATE POLICY "Catalog managers can delete products"
  ON products FOR DELETE USING (has_admin_scope('products:delete'));

-- Collections — public read
DROP POLICY IF EXISTS "Anyone can view collections" ON collections;
CREATE POLICY "Anyone can view collections" ON collections FOR SELECT USING (true);

-- Reviews — public read, authenticated write
DROP POLICY IF EXISTS "Anyone can read reviews"                 ON reviews;
DROP POLICY IF EXISTS "Authenticated users can write reviews"   ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews"            ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews"            ON reviews;
CREATE POLICY "Anyone can read reviews"               ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can write reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews"          ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews"          ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Addresses — private
DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);

-- Orders — private
DROP POLICY IF EXISTS "Users can view own orders"          ON orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can create orders"
  ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Wishlist — private
DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlist;
CREATE POLICY "Users can manage own wishlist" ON wishlist FOR ALL USING (auth.uid() = user_id);

-- Promotions — public read for validation
DROP POLICY IF EXISTS "Anyone can read active promotions" ON promotions;
CREATE POLICY "Anyone can read active promotions"
  ON promotions FOR SELECT USING (active = true);

-- Support tickets — users own their tickets; agents can manage via scope
DROP POLICY IF EXISTS "Users can view own tickets"           ON support_tickets;
DROP POLICY IF EXISTS "Users can create tickets"             ON support_tickets;
DROP POLICY IF EXISTS "Users can update own open tickets"    ON support_tickets;
DROP POLICY IF EXISTS "Scoped agents can update tickets"     ON support_tickets;
DROP POLICY IF EXISTS "Scoped agents can resolve tickets"    ON support_tickets;
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own open tickets"
  ON support_tickets FOR UPDATE
  USING (auth.uid() = user_id AND status NOT IN ('closed', 'resolved'));
CREATE POLICY "Scoped agents can update tickets"
  ON support_tickets FOR UPDATE
  USING (has_admin_scope('tickets:write'))
  WITH CHECK (has_admin_scope('tickets:write'));
CREATE POLICY "Scoped agents can resolve tickets"
  ON support_tickets FOR UPDATE
  USING (has_admin_scope('tickets:resolve'))
  WITH CHECK (has_admin_scope('tickets:resolve'));

-- Ticket messages
DROP POLICY IF EXISTS "Users can view messages on own tickets"       ON ticket_messages;
DROP POLICY IF EXISTS "Users can send messages on own open tickets"  ON ticket_messages;
DROP POLICY IF EXISTS "Agents can send ticket messages"              ON ticket_messages;
CREATE POLICY "Users can view messages on own tickets"
  ON ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can send messages on own open tickets"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_id
        AND t.user_id = auth.uid()
        AND t.status NOT IN ('closed')
    )
  );
CREATE POLICY "Agents can send ticket messages"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    has_admin_scope('tickets:write') AND
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Return requests — private
DROP POLICY IF EXISTS "Users can manage own return requests" ON return_requests;
CREATE POLICY "Users can manage own return requests"
  ON return_requests FOR ALL USING (auth.uid() = user_id);

-- Ticket notifications — private
DROP POLICY IF EXISTS "Users can view own notifications"        ON ticket_notifications;
DROP POLICY IF EXISTS "Users can mark own notifications read"   ON ticket_notifications;
CREATE POLICY "Users can view own notifications"
  ON ticket_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark own notifications read"
  ON ticket_notifications FOR UPDATE USING (auth.uid() = user_id);

-- Search events — insert-open, users see own
DROP POLICY IF EXISTS "search_events: user selects own"  ON search_events;
DROP POLICY IF EXISTS "search_events: anyone inserts"    ON search_events;
CREATE POLICY "search_events: user selects own"
  ON search_events FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "search_events: anyone inserts"
  ON search_events FOR INSERT WITH CHECK (true);

-- Admin users
DROP POLICY IF EXISTS "Admins can read admin_users"          ON admin_users;
DROP POLICY IF EXISTS "Master admins can manage admin_users" ON admin_users;
CREATE POLICY "Admins can read admin_users"
  ON admin_users FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));
CREATE POLICY "Master admins can manage admin_users"
  ON admin_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND role = 'master_admin'
    )
  );

-- Admin audit log
DROP POLICY IF EXISTS "Admins can read audit log"   ON admin_audit_log;
DROP POLICY IF EXISTS "System inserts audit log"    ON admin_audit_log;
CREATE POLICY "Admins can read audit log"
  ON admin_audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));
CREATE POLICY "System inserts audit log"
  ON admin_audit_log FOR INSERT
  WITH CHECK (admin_id = auth.uid());

-- ─── REALTIME REPLICATION ────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_notifications;

-- ─── SEED DATA ────────────────────────────────────────────────────────────────

INSERT INTO products (slug, name, description, category, subcategory, price, compare_at_price, images, variants, tags, status, featured, best_seller, new_arrival, materials, care_instructions, fit_guide)
VALUES
  (
    'fairway-performance-polo',
    'Fairway Performance Polo',
    'Engineered for the modern golfer. Our signature polo combines moisture-wicking fabric with a tailored silhouette that moves with you through every swing. UV-protective and breathable — built for 18 holes and beyond.',
    'apparel', 'polo',
    89.00, 110.00,
    ARRAY['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800', 'https://images.unsplash.com/photo-1594938298603-c8148c4b4f5a?w=800'],
    '[
      {"id":"v1a","product_id":"","color":{"name":"Navy","hex":"#1e3a5f","images":["https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800"]},"sizes":[{"label":"S","stock":5},{"label":"M","stock":8},{"label":"L","stock":6},{"label":"XL","stock":3},{"label":"XXL","stock":2}],"sku":"FPP-NAV"},
      {"id":"v1b","product_id":"","color":{"name":"White","hex":"#f8f8f8","images":["https://images.unsplash.com/photo-1594938298603-c8148c4b4f5a?w=800"]},"sizes":[{"label":"S","stock":4},{"label":"M","stock":7},{"label":"L","stock":9},{"label":"XL","stock":5}],"sku":"FPP-WHT"}
    ]'::jsonb,
    ARRAY['polo', 'performance', 'UV-protection', 'golf'],
    'active', true, true, false,
    '92% Polyester, 8% Elastane',
    'Machine wash cold. Tumble dry low. Do not iron decoration.',
    'Athletic fit — we recommend sizing up for a relaxed feel.'
  ),
  (
    'links-stretch-trouser',
    'Links Stretch Trouser',
    'A modern 5-pocket pant engineered with four-way stretch fabric. Tailored through the thigh with a tapered leg — sharp enough for the clubhouse, comfortable enough for the back nine.',
    'apparel', 'pants',
    125.00, NULL,
    ARRAY['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800'],
    '[
      {"id":"v2a","product_id":"","color":{"name":"Stone","hex":"#b5a694","images":["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800"]},"sizes":[{"label":"S","stock":3},{"label":"M","stock":6},{"label":"L","stock":4},{"label":"XL","stock":2}],"sku":"LST-STO"},
      {"id":"v2b","product_id":"","color":{"name":"Black","hex":"#111111","images":["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800"]},"sizes":[{"label":"S","stock":5},{"label":"M","stock":8},{"label":"L","stock":6},{"label":"XL","stock":4}],"sku":"LST-BLK"}
    ]'::jsonb,
    ARRAY['pants', 'stretch', 'golf', 'performance'],
    'active', false, true, false,
    '72% Nylon, 25% Polyester, 3% Elastane',
    'Machine wash cold. Hang dry recommended.',
    'Slim fit. True to size.'
  ),
  (
    'tour-snapback-cap',
    'Tour Snapback Cap',
    'Our most popular cap — structured, clean, and built to last. Features moisture-wicking sweatband and UV-blocking fabric. The signature Parmore embroidered crest sits at center-front.',
    'headwear', 'snapback',
    45.00, NULL,
    ARRAY['https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800'],
    '[
      {"id":"v3a","product_id":"","color":{"name":"Slate","hex":"#6b7280","images":["https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800"]},"sizes":[{"label":"OSFM","stock":20}],"sku":"TSC-SLT"},
      {"id":"v3b","product_id":"","color":{"name":"Cream","hex":"#f5f0e8","images":["https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800"]},"sizes":[{"label":"OSFM","stock":15}],"sku":"TSC-CRM"},
      {"id":"v3c","product_id":"","color":{"name":"Black","hex":"#111111","images":["https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800"]},"sizes":[{"label":"OSFM","stock":25}],"sku":"TSC-BLK"}
    ]'::jsonb,
    ARRAY['hat', 'snapback', 'golf', 'UV-protection'],
    'active', true, true, false,
    '100% Cotton Twill',
    'Spot clean with damp cloth.',
    'One size fits most. Adjustable snapback closure.'
  ),
  (
    'caddie-quarter-zip',
    'Caddie Quarter-Zip',
    'The perfect mid-layer. Lightweight and packable with moisture-management technology. Channels classic athletic heritage with a modern, streamlined silhouette.',
    'apparel', 'outerwear',
    145.00, 180.00,
    ARRAY['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800'],
    '[
      {"id":"v4a","product_id":"","color":{"name":"Forest","hex":"#2d4a2d","images":["https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800"]},"sizes":[{"label":"S","stock":4},{"label":"M","stock":7},{"label":"L","stock":5},{"label":"XL","stock":3}],"sku":"CQZ-FOR"},
      {"id":"v4b","product_id":"","color":{"name":"Navy","hex":"#1e3a5f","images":["https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800"]},"sizes":[{"label":"S","stock":3},{"label":"M","stock":6},{"label":"L","stock":4}],"sku":"CQZ-NAV"}
    ]'::jsonb,
    ARRAY['outerwear', 'quarter-zip', 'golf', 'layer'],
    'active', true, false, true,
    '100% Recycled Polyester',
    'Machine wash cold. Tumble dry low.',
    'Regular fit. Size up for layering.'
  ),
  (
    'links-bucket-hat',
    'Links Bucket Hat',
    'Sun-drenched rounds call for full coverage. Our bucket hat delivers 360-degree protection with a wide brim and breathable eyelets. The relaxed silhouette makes it equally at home on and off the course.',
    'headwear', 'bucket',
    52.00, NULL,
    ARRAY['https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=800'],
    '[
      {"id":"v5a","product_id":"","color":{"name":"Khaki","hex":"#c8b89a","images":["https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=800"]},"sizes":[{"label":"S/M","stock":12},{"label":"L/XL","stock":10}],"sku":"LBH-KHK"},
      {"id":"v5b","product_id":"","color":{"name":"White","hex":"#f8f8f8","images":["https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=800"]},"sizes":[{"label":"S/M","stock":8},{"label":"L/XL","stock":6}],"sku":"LBH-WHT"}
    ]'::jsonb,
    ARRAY['hat', 'bucket', 'golf', 'UV-protection', 'sun'],
    'active', false, false, true,
    '100% Cotton',
    'Machine wash cold. Air dry.',
    'Relaxed fit.'
  ),
  (
    'birdie-crewneck-sweatshirt',
    'Birdie Crewneck Sweatshirt',
    'Heavyweight French terry construction meets minimal Parmore branding. An everyday staple for the golf lifestyle. Brushed interior for premium warmth and comfort.',
    'apparel', 'sweatshirt',
    98.00, NULL,
    ARRAY['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800'],
    '[
      {"id":"v6a","product_id":"","color":{"name":"Oatmeal","hex":"#d4c5b0","images":["https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800"]},"sizes":[{"label":"S","stock":5},{"label":"M","stock":8},{"label":"L","stock":7},{"label":"XL","stock":4},{"label":"XXL","stock":2}],"sku":"BCS-OAT"},
      {"id":"v6b","product_id":"","color":{"name":"Charcoal","hex":"#374151","images":["https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800"]},"sizes":[{"label":"S","stock":4},{"label":"M","stock":6},{"label":"L","stock":5},{"label":"XL","stock":3}],"sku":"BCS-CHA"}
    ]'::jsonb,
    ARRAY['sweatshirt', 'crewneck', 'golf', 'casual'],
    'active', false, true, false,
    '80% Cotton, 20% Polyester French Terry',
    'Machine wash cold. Tumble dry low.',
    'Oversized fit. Size down for a regular look.'
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO collections (slug, name, description, image, product_ids, featured, season)
VALUES
  (
    'the-fairway-edit',
    'The Fairway Edit',
    'On-course essentials engineered for performance without compromise.',
    'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200',
    ARRAY[]::UUID[], true, 'SS25'
  ),
  (
    'clubhouse-collection',
    'Clubhouse Collection',
    'From the 18th green to the lounge — elevated essentials for every setting.',
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200',
    ARRAY[]::UUID[], true, 'SS25'
  ),
  (
    'signature-headwear',
    'Signature Headwear',
    'Protection meets precision. Our full lineup of course-ready caps and hats.',
    'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=1200',
    ARRAY[]::UUID[], true, 'SS25'
  )
ON CONFLICT (slug) DO NOTHING;

-- ─── NOTES ────────────────────────────────────────────────────────────────────
-- To apply: npx supabase db push  (from project/ directory)
-- To refresh the materialized view on a schedule, use pg_cron:
--   SELECT cron.schedule('refresh-top-terms', '0 * * * *',
--     'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_search_terms');
-- Master admin seed: after creating an auth user, insert into admin_users:
--   INSERT INTO admin_users (id, email, full_name, role, scopes)
--   VALUES ('<auth.uid>', 'admin@parmore.com', 'Parmore Admin', 'master_admin',
--     ARRAY['analytics:read','products:read','products:write','products:delete',
--           'products:publish','tickets:read','tickets:write','tickets:resolve',
--           'tickets:refund','team:read','team:write'])
--   ON CONFLICT (id) DO NOTHING;
