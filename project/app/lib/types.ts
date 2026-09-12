// ─── Product & Catalog ───────────────────────────────────────────────────────

export type ProductCategory = 'apparel' | 'headwear' | 'accessories';

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface ProductColor {
  name: string;
  hex: string;
  images: string[];
}

export interface ProductSize {
  label: string; // 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'OSFM'
  stock: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  color: ProductColor;
  sizes: ProductSize[];
  sku: string;
  price_override?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ProductCategory;
  subcategory?: string;
  price: number;
  compare_at_price?: number;
  images: string[];
  variants: ProductVariant[];
  tags: string[];
  status: ProductStatus;
  featured: boolean;
  best_seller: boolean;
  new_arrival: boolean;
  materials?: string;
  care_instructions?: string;
  fit_guide?: string;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  product_ids: string[];
  featured: boolean;
  season?: string;
  created_at: string;
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string; // unique line-item id
  product_id: string;
  variant_id: string;
  product: Product;
  variant: ProductVariant;
  color: ProductColor;
  size: string;
  quantity: number;
  unit_price: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  item_count: number;
}

// ─── User & Auth ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default: boolean;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  product_id: string;
  variant_id: string;
  product_name: string;
  color_name: string;
  size: string;
  quantity: number;
  unit_price: number;
  total: number;
  image_url: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  items: OrderItem[];
  shipping_address: Address;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number; // 1-5
  title: string;
  body: string;
  verified_purchase: boolean;
  created_at: string;
}

// ─── Wishlist ────────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product: Product;
  added_at: string;
}

// ─── UI State ────────────────────────────────────────────────────────────────

export interface FilterState {
  category: ProductCategory | 'all';
  subcategory: string | null;
  colors: string[];
  sizes: string[];
  priceMin: number;
  priceMax: number;
  sortBy: SortOption;
}

export type SortOption =
  | 'featured'
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'best-selling';

export interface SearchResult {
  products: Product[];
  collections: Collection[];
  total: number;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

// ─── Support Tickets (Part 2) ─────────────────────────────────────────────────

export type TicketStatus = 'open' | 'in_review' | 'actioned' | 'resolved' | 'closed';

export type TicketCategory =
  | 'order_issue'
  | 'return_request'
  | 'exchange'
  | 'product_question'
  | 'shipping'
  | 'billing'
  | 'other';

export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'shipped_back'
  | 'received'
  | 'refunded';

export type ReturnReason =
  | 'wrong_size'
  | 'wrong_item'
  | 'defective'
  | 'not_as_described'
  | 'changed_mind'
  | 'other';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  order_id?: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: 1 | 2 | 3 | 4 | 5;
  assigned_agent?: string;
  resolved_at?: string;
  closed_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id?: string;
  sender_name: string;
  content: string;
  is_agent: boolean;
  is_system: boolean;
  attachments: string[];
  created_at: string;
}

export interface ReturnItem {
  order_item_index: number;
  product_name: string;
  color_name: string;
  size: string;
  quantity: number;
  unit_price: number;
}

export interface ReturnRequest {
  id: string;
  return_number: string;
  user_id: string;
  order_id: string;
  ticket_id?: string;
  items: ReturnItem[];
  reason: ReturnReason;
  notes?: string;
  status: ReturnStatus;
  refund_amount?: number;
  return_label?: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketNotification {
  id: string;
  user_id: string;
  ticket_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

// ─── Promotional ─────────────────────────────────────────────────────────────

export interface HeroBanner {
  id: string;
  headline: string;
  subheadline: string;
  cta_label: string;
  cta_href: string;
  image_desktop: string;
  image_mobile: string;
  text_color: 'light' | 'dark';
  active: boolean;
}

export interface Promotion {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order?: number;
  max_uses?: number;
  uses: number;
  expires_at?: string;
  active: boolean;
}
