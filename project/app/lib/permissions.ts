// Scope definition dictionary and permission validation guards.
// In production: scopes live in admin_users.scopes (text[]) in Supabase
// and are validated server-side via has_admin_scope() RLS helper.

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminScope =
  | 'analytics:read'
  | 'products:read'
  | 'products:write'
  | 'products:delete'
  | 'products:publish'
  | 'tickets:read'
  | 'tickets:write'
  | 'tickets:resolve'
  | 'tickets:refund'
  | 'team:read'
  | 'team:write';

export type AdminRole =
  | 'master_admin'
  | 'support_agent'
  | 'catalog_manager'
  | 'analytics_viewer';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  scopes: AdminScope[];
  avatar_initials: string;
  created_at: string;
  last_active_at?: string;
}

// ─── Scope Metadata ───────────────────────────────────────────────────────────

export const ALL_SCOPES: AdminScope[] = [
  'analytics:read',
  'products:read',
  'products:write',
  'products:delete',
  'products:publish',
  'tickets:read',
  'tickets:write',
  'tickets:resolve',
  'tickets:refund',
  'team:read',
  'team:write',
];

export const SCOPE_LABELS: Record<AdminScope, { label: string; description: string; group: string }> = {
  'analytics:read':   { label: 'View Analytics',   description: 'Revenue, AOV, conversion, top searches', group: 'Analytics' },
  'products:read':    { label: 'View Products',     description: 'Browse catalog, see stock levels',       group: 'Catalog' },
  'products:write':   { label: 'Edit Products',     description: 'Create and update product listings',     group: 'Catalog' },
  'products:delete':  { label: 'Delete Products',   description: 'Permanently remove products',            group: 'Catalog' },
  'products:publish': { label: 'Publish / Draft',   description: 'Toggle active / draft status',           group: 'Catalog' },
  'tickets:read':     { label: 'View Tickets',      description: 'Read all support conversations',         group: 'Support' },
  'tickets:write':    { label: 'Reply to Tickets',  description: 'Send messages to customers',             group: 'Support' },
  'tickets:resolve':  { label: 'Resolve Tickets',   description: 'Change ticket status to resolved/closed', group: 'Support' },
  'tickets:refund':   { label: 'Issue Refunds',     description: 'Approve and process customer refunds',   group: 'Support' },
  'team:read':        { label: 'View Team',         description: 'See admin accounts and scopes',          group: 'Team' },
  'team:write':       { label: 'Manage Team',       description: 'Add, edit, or remove admin accounts',    group: 'Team' },
};

// ─── Role Presets ─────────────────────────────────────────────────────────────

export const ROLE_DEFAULT_SCOPES: Record<AdminRole, AdminScope[]> = {
  master_admin:     ALL_SCOPES,
  support_agent:    ['tickets:read', 'tickets:write', 'tickets:resolve'],
  catalog_manager:  ['products:read', 'products:write', 'products:delete', 'products:publish'],
  analytics_viewer: ['analytics:read'],
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  master_admin:     'Master Admin',
  support_agent:    'Support Agent',
  catalog_manager:  'Catalog Manager',
  analytics_viewer: 'Analytics Viewer',
};

export const ROLE_COLORS: Record<AdminRole, string> = {
  master_admin:     'bg-parmore-gold/15 text-yellow-800',
  support_agent:    'bg-blue-50 text-blue-700',
  catalog_manager:  'bg-purple-50 text-purple-700',
  analytics_viewer: 'bg-emerald-50 text-emerald-700',
};

// ─── Guards ───────────────────────────────────────────────────────────────────

export function hasScope(user: AdminUser, scope: AdminScope): boolean {
  return user.scopes.includes(scope);
}

export function hasAnyScope(user: AdminUser, scopes: AdminScope[]): boolean {
  return scopes.some((s) => user.scopes.includes(s));
}

export function hasAllScopes(user: AdminUser, scopes: AdminScope[]): boolean {
  return scopes.every((s) => user.scopes.includes(s));
}

export function isMasterAdmin(user: AdminUser): boolean {
  return user.role === 'master_admin';
}

/** Returns the nav sections this admin is allowed to see. */
export function getAllowedSections(user: AdminUser): string[] {
  const sections: string[] = ['dashboard'];
  if (hasScope(user, 'analytics:read')) sections.push('analytics');
  if (hasScope(user, 'products:read')) sections.push('products');
  if (hasScope(user, 'tickets:read')) sections.push('tickets');
  if (hasScope(user, 'team:read')) sections.push('team');
  return sections;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Change MOCK_CURRENT_ADMIN.role to test different permission gates in the UI.

export const MOCK_CURRENT_ADMIN: AdminUser = {
  id: 'admin-001',
  email: 'james.chen@parmore.com',
  full_name: 'James Chen',
  role: 'master_admin',
  scopes: ALL_SCOPES,
  avatar_initials: 'JC',
  created_at: '2024-01-01T00:00:00Z',
  last_active_at: new Date().toISOString(),
};

export const MOCK_TEAM_MEMBERS: AdminUser[] = [
  MOCK_CURRENT_ADMIN,
  {
    id: 'admin-002',
    email: 'sarah.kim@parmore.com',
    full_name: 'Sarah Kim',
    role: 'support_agent',
    scopes: [...ROLE_DEFAULT_SCOPES.support_agent, 'tickets:refund'],
    avatar_initials: 'SK',
    created_at: '2024-03-15T00:00:00Z',
    last_active_at: '2026-09-13T14:22:00Z',
  },
  {
    id: 'admin-003',
    email: 'marcus.davis@parmore.com',
    full_name: 'Marcus Davis',
    role: 'catalog_manager',
    scopes: ROLE_DEFAULT_SCOPES.catalog_manager,
    avatar_initials: 'MD',
    created_at: '2024-05-01T00:00:00Z',
    last_active_at: '2026-09-14T09:05:00Z',
  },
  {
    id: 'admin-004',
    email: 'priya.nair@parmore.com',
    full_name: 'Priya Nair',
    role: 'analytics_viewer',
    scopes: ROLE_DEFAULT_SCOPES.analytics_viewer,
    avatar_initials: 'PN',
    created_at: '2024-07-20T00:00:00Z',
    last_active_at: '2026-09-12T16:45:00Z',
  },
];
