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

// ─── Account Queries (Part 2) ─────────────────────────────────────────────────

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ─── Ticket Queries (Part 2) ──────────────────────────────────────────────────

export async function fetchTickets(userId: string) {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchTicket(ticketId: string) {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .single();
  if (error) throw error;
  return data;
}

export async function createTicket(payload: {
  user_id: string;
  subject: string;
  category: string;
  order_id?: string;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from('support_tickets')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchTicketMessages(ticketId: string) {
  const { data, error } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function sendTicketMessage(payload: {
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  is_agent?: boolean;
}) {
  const { data, error } = await supabase
    .from('ticket_messages')
    .insert({ ...payload, is_agent: payload.is_agent ?? false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchReturnRequests(userId: string) {
  const { data, error } = await supabase
    .from('return_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createReturnRequest(payload: {
  user_id: string;
  order_id: string;
  ticket_id?: string;
  items: unknown[];
  reason: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('return_requests')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from('ticket_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data;
}

export async function markNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('ticket_notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
}

// ─── Realtime Channel Helpers (Part 2) ───────────────────────────────────────

export function subscribeToTicketMessages(
  ticketId: string,
  onMessage: (msg: Record<string, unknown>) => void
) {
  return supabase
    .channel(`ticket-messages:${ticketId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
        filter: `ticket_id=eq.${ticketId}`,
      },
      (payload) => onMessage(payload.new as Record<string, unknown>)
    )
    .subscribe();
}

export function subscribeToTicketStatus(
  ticketId: string,
  onUpdate: (ticket: Record<string, unknown>) => void
) {
  return supabase
    .channel(`ticket-status:${ticketId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'support_tickets',
        filter: `id=eq.${ticketId}`,
      },
      (payload) => onUpdate(payload.new as Record<string, unknown>)
    )
    .subscribe();
}
