'use client';

import React, { useState } from 'react';
import { redirect } from 'next/navigation';
import { Plus, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { MOCK_CURRENT_ADMIN, MOCK_TEAM_MEMBERS, hasScope, isMasterAdmin, ROLE_LABELS, ROLE_COLORS, ROLE_DEFAULT_SCOPES, ALL_SCOPES } from '@/app/lib/permissions';
import type { AdminUser, AdminScope, AdminRole } from '@/app/lib/permissions';
import { ScopeSelector } from '@/components/admin/ScopeSelector';
import { Table } from '@/components/ui/Table';
import type { TableColumn } from '@/components/ui/Table';
import { cn } from '@/app/lib/utils';

const ROLES: AdminRole[] = ['master_admin', 'support_agent', 'catalog_manager', 'analytics_viewer'];

function MemberRow({ member, currentAdmin, onSave }: {
  member: AdminUser;
  currentAdmin: AdminUser;
  onSave: (id: string, scopes: AdminScope[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [scopes, setScopes] = useState<AdminScope[]>(member.scopes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const canEdit = isMasterAdmin(currentAdmin) && member.id !== currentAdmin.id;

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    onSave(member.id, scopes);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="border border-zinc-100 rounded-sm overflow-hidden">
      <div
        className={cn('flex items-center gap-3 px-4 py-3 bg-white', canEdit && 'cursor-pointer hover:bg-zinc-50')}
        onClick={() => canEdit && setExpanded((v) => !v)}
      >
        <div className="h-8 w-8 rounded-full bg-parmore-gold flex items-center justify-center text-parmore-black text-xs font-bold shrink-0">
          {member.avatar_initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-parmore-black">{member.full_name}</p>
          <p className="text-2xs text-parmore-slate">{member.email}</p>
        </div>
        <span className={cn('text-2xs px-1.5 py-0.5 rounded-full font-medium', ROLE_COLORS[member.role])}>
          {ROLE_LABELS[member.role]}
        </span>
        <span className="text-2xs text-zinc-400">{member.scopes.length}/{ALL_SCOPES.length} scopes</span>
        {canEdit && (expanded ? <ChevronUp className="h-3.5 w-3.5 text-zinc-400" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />)}
      </div>

      {expanded && canEdit && (
        <div className="border-t border-zinc-100 px-4 py-4 bg-zinc-50 space-y-4">
          <ScopeSelector selected={scopes} onChange={setScopes} showPresets />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-parmore-black text-white text-xs font-medium rounded-sm hover:bg-zinc-800 disabled:opacity-60 transition-colors"
            >
              {saved ? <Check className="h-3.5 w-3.5" /> : null}
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save Permissions'}
            </button>
            <button onClick={() => setExpanded(false)} className="px-4 py-2 text-xs text-parmore-slate hover:text-parmore-black transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  const admin = MOCK_CURRENT_ADMIN;
  if (!hasScope(admin, 'team:read')) redirect('/admin');

  const canWrite = hasScope(admin, 'team:write');
  const [members, setMembers] = useState<AdminUser[]>(MOCK_TEAM_MEMBERS);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add member form state
  const [newEmail, setNewEmail]     = useState('');
  const [newName, setNewName]       = useState('');
  const [newRole, setNewRole]       = useState<AdminRole>('support_agent');
  const [newScopes, setNewScopes]   = useState<AdminScope[]>(ROLE_DEFAULT_SCOPES['support_agent']);
  const [addSaving, setAddSaving]   = useState(false);

  const handleRoleChange = (role: AdminRole) => {
    setNewRole(role);
    setNewScopes([...ROLE_DEFAULT_SCOPES[role]]);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) return;
    setAddSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const initials = newName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    const member: AdminUser = {
      id: `admin-${Date.now()}`,
      email: newEmail.trim(),
      full_name: newName.trim(),
      role: newRole,
      scopes: newScopes,
      avatar_initials: initials,
      created_at: new Date().toISOString(),
    };
    setMembers((ms) => [...ms, member]);
    setNewEmail(''); setNewName(''); setNewRole('support_agent');
    setNewScopes([...ROLE_DEFAULT_SCOPES['support_agent']]);
    setShowAddForm(false);
    setAddSaving(false);
  };

  const handleSaveScopes = (id: string, scopes: AdminScope[]) =>
    setMembers((ms) => ms.map((m) => m.id === id ? { ...m, scopes } : m));

  const INPUT_CLS = 'w-full px-3 h-9 border border-zinc-200 rounded-sm text-sm bg-white focus:outline-none focus:border-parmore-black transition-colors';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-parmore-black font-serif">Team</h1>
          <p className="text-xs text-parmore-slate mt-1">{members.length} admin members</p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-parmore-black text-white text-xs font-medium rounded-sm hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Admin
          </button>
        )}
      </div>

      {/* Add admin form */}
      {showAddForm && canWrite && (
        <form onSubmit={handleAdd} className="bg-white rounded-sm border border-zinc-200 p-5 space-y-4">
          <p className="text-xs font-semibold text-parmore-black">New Admin Member</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-parmore-slate mb-1 uppercase tracking-wider">Full Name</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required className={INPUT_CLS} placeholder="Jane Smith" />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-parmore-slate mb-1 uppercase tracking-wider">Email</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required className={INPUT_CLS} placeholder="jane@parmore.com" />
            </div>
          </div>
          <div>
            <label className="block text-2xs font-semibold text-parmore-slate mb-1 uppercase tracking-wider">Role</label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button
                  key={r} type="button" onClick={() => handleRoleChange(r)}
                  className={cn(
                    'px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors',
                    newRole === r ? 'bg-parmore-black text-white border-parmore-black' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                  )}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
          <ScopeSelector selected={newScopes} onChange={setNewScopes} showPresets={false} />
          <div className="flex gap-2">
            <button type="submit" disabled={addSaving} className="px-4 py-2 bg-parmore-black text-white text-xs font-medium rounded-sm hover:bg-zinc-800 disabled:opacity-60 transition-colors">
              {addSaving ? 'Adding…' : 'Add Member'}
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-xs text-parmore-slate hover:text-parmore-black transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Member list */}
      <div className="space-y-2">
        {members.map((m) => (
          <MemberRow key={m.id} member={m} currentAdmin={admin} onSave={handleSaveScopes} />
        ))}
      </div>
    </div>
  );
}
