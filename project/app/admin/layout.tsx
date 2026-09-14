import React from 'react';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { MOCK_CURRENT_ADMIN, getAllowedSections } from '@/app/lib/permissions';

export const metadata = { title: 'Admin — Parmore' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = MOCK_CURRENT_ADMIN;

  if (!admin) redirect('/');

  const allowed = getAllowedSections(admin);
  if (allowed.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <p className="text-sm font-semibold text-parmore-black">Access Denied</p>
          <p className="text-xs text-parmore-slate mt-1">You don't have permission to access the admin area.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminSidebar admin={admin} />

      {/* Desktop offset */}
      <div className="lg:pl-60">
        {/* Mobile top-bar offset */}
        <div className="lg:hidden h-12" />
        <main className="p-6 lg:p-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
