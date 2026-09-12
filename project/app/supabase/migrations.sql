-- ============================================================
-- PARMORE E-COMMERCE — COMPLETE DATABASE SCHEMA & RLS POLICIES
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- fuzzy text search

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

CREATE TYPE product_category AS ENUM ('apparel', 'headwear', 'accessories');
CREATE TYPE product_status AS ENUM ('active', 'draft', 'archived');
CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
);
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- ─── PROFILES ────────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────

CREATE TABLE products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  category            product_category NOT NULL,
  subcategory         TEXT,
  price               NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price    NUMERIC(10, 2) CHECK (compare_at_price >= 0),
  images              TEXT[] NOT NULL DEFAULT '{}',
  variants            JSONB NOT NULL DEFAULT '[]',
  tags                TEXT[] NOT NULL DEFAULT '{}',
  status              product_status NOT NULL DEFAULT 'draft',
  featured            BOOLEAN NOT NULL DEFAULT false,
  best_seller         BOOLEAN NOT NULL DEFAULT false,
  new_arrival         BOOLEAN NOT NULL DEFAULT false,
  materials           TEXT,
  care_instructions   TEXT,
  fit_guide           TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Full-text search index
CREATE INDEX products_name_search_idx ON products USING GIN (to_tsvector('english', name));
CREATE INDEX products_tags_idx ON products USING GIN (tags);
CREATE INDEX products_category_status_idx ON products (category, status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── COLLECTIONS ─────────────────────────────────────────────────────────────

CREATE TABLE collections (
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

CREATE INDEX collections_featured_idx ON collections (featured);

-- ─── REVIEWS ─────────────────────────────────────────────────────────────────

CREATE TABLE reviews (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name         TEXT NOT NULL,
  rating            SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title             TEXT NOT NULL DEFAULT '',
  body              TEXT NOT NULL DEFAULT '',
  verified_purchase BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id) -- one review per user per product
);

CREATE INDEX reviews_product_idx ON reviews (product_id);

-- ─── ADDRESSES ───────────────────────────────────────────────────────────────

CREATE TABLE addresses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  line1       TEXT NOT NULL,
  line2       TEXT,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  zip         TEXT NOT NULL,
  country     TEXT NOT NULL DEFAULT 'US',
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX addresses_user_idx ON addresses (user_id);

-- Ensure only one default address per user
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

CREATE TRIGGER single_default_address
  AFTER INSERT OR UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION enforce_single_default_address();

-- ─── ORDERS ──────────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number      TEXT NOT NULL UNIQUE DEFAULT ('ORD-' || upper(substring(gen_random_uuid()::text, 1, 8))),
  user_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  items             JSONB NOT NULL DEFAULT '[]',
  shipping_address  JSONB NOT NULL DEFAULT '{}',
  status            order_status NOT NULL DEFAULT 'pending',
  subtotal          NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost     NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  tax               NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total             NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  tracking_number   TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX orders_user_idx ON orders (user_id);
CREATE INDEX orders_status_idx ON orders (status);
CREATE INDEX orders_created_at_idx ON orders (created_at DESC);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── WISHLIST ─────────────────────────────────────────────────────────────────

CREATE TABLE wishlist (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX wishlist_user_idx ON wishlist (user_id);

-- ─── PROMOTIONS ───────────────────────────────────────────────────────────────

CREATE TABLE promotions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT NOT NULL UNIQUE,
  description     TEXT NOT NULL DEFAULT '',
  discount_type   discount_type NOT NULL,
  discount_value  NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order       NUMERIC(10, 2),
  max_uses        INTEGER,
  uses            INTEGER NOT NULL DEFAULT 0,
  expires_at      TIMESTAMPTZ,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Products — public read
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (status = 'active');

-- Collections — public read
CREATE POLICY "Anyone can view collections" ON collections
  FOR SELECT USING (true);

-- Reviews — public read, authenticated write
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can write reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Addresses — private
CREATE POLICY "Users can manage own addresses" ON addresses
  FOR ALL USING (auth.uid() = user_id);

-- Orders — private
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Wishlist — private
CREATE POLICY "Users can manage own wishlist" ON wishlist
  FOR ALL USING (auth.uid() = user_id);

-- Promotions — public read for validation
CREATE POLICY "Anyone can read active promotions" ON promotions
  FOR SELECT USING (active = true);

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
  );

INSERT INTO collections (slug, name, description, image, product_ids, featured, season)
VALUES
  (
    'the-fairway-edit',
    'The Fairway Edit',
    'On-course essentials engineered for performance without compromise.',
    'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200',
    ARRAY[]::UUID[],
    true,
    'SS25'
  ),
  (
    'clubhouse-collection',
    'Clubhouse Collection',
    'From the 18th green to the lounge — elevated essentials for every setting.',
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200',
    ARRAY[]::UUID[],
    true,
    'SS25'
  ),
  (
    'signature-headwear',
    'Signature Headwear',
    'Protection meets precision. Our full lineup of course-ready caps and hats.',
    'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=1200',
    ARRAY[]::UUID[],
    true,
    'SS25'
  );
