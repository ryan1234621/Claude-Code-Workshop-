'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { AdminScope, AdminRole } from '@/app/lib/permissions';
import { ALL_SCOPES, SCOPE_LABELS, ROLE_DEFAULT_SCOPES, ROLE_LABELS } from '@/app/lib/permissions';
import { cn } from '@/app/lib/utils';

interface ScopeSelectorProps {
  selected: AdminScope[];
  onChange: (scopes: AdminScope[]) => void;
  disabled?: boolean;
  /** If provided, shows role preset buttons */
  showPresets?: boolean;
}

// Group scopes by their display group
function groupScopes() {
  const groups = new Map<string, AdminScope[]>();
  for (const scope of ALL_SCOPES) {
    const { group } = SCOPE_LABELS[scope];
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(scope);
  }
  return [...groups.entries()];
}

const GROUPED_SCOPES = groupScopes();

const ROLE_PRESETS: { role: AdminRole; color: string }[] = [
  { role: 'master_admin',    color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { role: 'support_agent',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { role: 'catalog_manager', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { role: 'analytics_viewer',color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

export function ScopeSelector({ selected, onChange, disabled = false, showPresets = true }: ScopeSelectorProps) {
  const toggle = (scope: AdminScope) => {
    if (disabled) return;
    onChange(
      selected.includes(scope)
        ? selected.filter((s) => s !== scope)
        : [...selected, scope]
    );
  };

  const applyPreset = (role: AdminRole) => {
    if (disabled) return;
    onChange([...ROLE_DEFAULT_SCOPES[role]]);
  };

  return (
    <div className="space-y-4">
      {/* Role presets */}
      {showPresets && (
        <div>
          <p className="text-2xs font-semibold tracking-wider uppercase text-parmore-slate mb-2">
            Quick Presets
          </p>
          <div className="flex flex-wrap gap-2">
            {ROLE_PRESETS.map(({ role, color }) => (
              <button
                key={role}
                onClick={() => applyPreset(role)}
                disabled={disabled}
                className={cn(
                  'px-3 py-1 rounded-full border text-xs font-medium transition-all',
                  color,
                  disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'
                )}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scope matrix */}
      {GROUPED_SCOPES.map(([group, scopes]) => (
        <div key={group}>
          <p className="text-2xs font-semibold tracking-wider uppercase text-parmore-slate mb-2">
            {group}
          </p>
          <div className="space-y-2">
            {scopes.map((scope) => {
              const { label, description } = SCOPE_LABELS[scope];
              const checked = selected.includes(scope);
              return (
                <label
                  key={scope}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-all',
                    checked
                      ? 'border-parmore-gold/50 bg-parmore-gold/5'
                      : 'border-zinc-200 hover:border-zinc-300',
                    disabled && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <div
                    className={cn(
                      'h-4 w-4 rounded shrink-0 border-2 flex items-center justify-center transition-colors mt-0.5',
                      checked ? 'bg-parmore-black border-parmore-black' : 'border-zinc-300 bg-white'
                    )}
                    onClick={() => toggle(scope)}
                  >
                    {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-parmore-black">{label}</p>
                    <p className="text-xs text-parmore-slate mt-0.5">{description}</p>
                  </div>
                  <code className="text-2xs text-zinc-400 font-mono shrink-0 mt-0.5">{scope}</code>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="pt-2 border-t border-zinc-100">
        <p className="text-xs text-parmore-slate">
          <span className="font-semibold text-parmore-black">{selected.length}</span> of {ALL_SCOPES.length} scopes granted
        </p>
      </div>
    </div>
  );
}
