import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ─── Product Queries ──────────────────────────────────────────────────────────

export async function fetchProducts(options?: {
  category?: string;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  limit?: number;
}) {
  let query = supabase.from('products').select('*').eq('status', 'active');

  if (options?.category && options.category !== 'all') {
    query = query.eq('category', options.category);
  }
  if (options?.featured) query = query.eq('featured', true);
  if (options?.bestSeller) query = query.eq('best_seller', true);
  if (options?.newArrival) query = query.eq('new_arrival', true);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();
  if (error) throw error;
  return data;
}

export async function fetchCollections(featuredOnly = false) {
  let query = supabase.from('collections').select('*');
  if (featuredOnly) query = query.eq('featured', true);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchReviews(productId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
