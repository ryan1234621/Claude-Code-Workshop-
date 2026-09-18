import type { User } from '@supabase/supabase-js';

// ─── Role types ───────────────────────────────────────────────────────────────

export type UserRole = 'master_admin' | 'staff_admin' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
}

// ─── Role detection ───────────────────────────────────────────────────────────

/** Reads role from user_metadata (set at registration or by admin). */
export function getUserRole(user: User): UserRole {
  const meta = user.user_metadata as Record<string, unknown>;
  const raw = meta?.role as string | undefined;
  if (raw === 'master_admin' || raw === 'staff_admin') return raw;
  return 'customer';
}

export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  const role = getUserRole(user);
  return role === 'master_admin' || role === 'staff_admin';
}

export function isMasterAdmin(user: User | null): boolean {
  if (!user) return false;
  return getUserRole(user) === 'master_admin';
}

// ─── Redirect resolver ────────────────────────────────────────────────────────

/** Returns the path to redirect to after a successful sign-in. */
export function getPostLoginRedirect(user: User, intendedPath?: string): string {
  const role = getUserRole(user);
  if (role === 'master_admin' || role === 'staff_admin') {
    return intendedPath?.startsWith('/admin') ? intendedPath : '/admin';
  }
  return intendedPath?.startsWith('/account') ? intendedPath : '/account';
}

// ─── Role display helpers ─────────────────────────────────────────────────────

export const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string }> = {
  master_admin: {
    label: 'Master Admin',
    color: 'text-amber-800',
    bg:    'bg-amber-100',
  },
  staff_admin: {
    label: 'Staff Admin',
    color: 'text-emerald-800',
    bg:    'bg-emerald-100',
  },
  customer: {
    label: 'Member',
    color: 'text-zinc-600',
    bg:    'bg-zinc-100',
  },
};

// ─── Sign-out helper ──────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const { createSupabaseBrowserClient } = await import('@/lib/supabase/browser');
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
  window.location.href = '/';
}
