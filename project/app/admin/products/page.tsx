'use client';

import React, { useState } from 'react';
import { redirect } from 'next/navigation';
import { Plus, Eye, Pencil, Archive, Globe } from 'lucide-react';
import { MOCK_CURRENT_ADMIN, hasScope } from '@/app/lib/permissions';
import { MOCK_PRODUCTS } from '@/app/lib/mockData';
import { Table } from '@/components/ui/Table';
import type { TableColumn } from '@/components/ui/Table';
import { ProductEditorModal } from '@/components/admin/ProductEditorModal';
import type { Product, ProductStatus } from '@/app/lib/types';
import { cn } from '@/app/lib/utils';

const STATUS_CHIP: Record<ProductStatus, string> = {
  active:   'bg-emerald-50 text-emerald-700',
  draft:    'bg-amber-50 text-amber-700',
  archived: 'bg-zinc-100 text-zinc-500',
};

type StatusFilter = ProductStatus | 'all';

export default function ProductsPage() {
  const admin = MOCK_CURRENT_ADMIN;
  if (!hasScope(admin, 'products:read')) redirect('/admin');

  const canWrite   = hasScope(admin, 'products:write');
  const canDelete  = hasScope(admin, 'products:delete');
  const canPublish = hasScope(admin, 'products:publish');

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [filter, setFilter]   = useState<StatusFilter>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const visible = filter === 'all' ? products : products.filter((p) => p.status === filter);

  const openEditor = (product?: Product) => {
    setEditing(product ?? null);
    setEditorOpen(true);
  };

  const handleSave = async (data: Partial<Product>) => {
    await new Promise((r) => setTimeout(r, 600));
    if (editing) {
      setProducts((ps) => ps.map((p) => p.id === editing.id ? { ...p, ...data, updated_at: new Date().toISOString() } : p));
    } else {
      const newProd: Product = {
        id: `p-${Date.now()}`, slug: data.name?.toLowerCase().replace(/\s+/g, '-') ?? '',
        images: [], variants: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        featured: false, best_seller: false, new_arrival: false, tags: [],
        name: '', description: '', category: 'apparel', price: 0, status: 'draft',
        ...data,
      } as Product;
      setProducts((ps) => [newProd, ...ps]);
    }
  };

  const setStatus = (id: string, status: ProductStatus) =>
    setProducts((ps) => ps.map((p) => p.id === id ? { ...p, status } : p));

  const COLUMNS: TableColumn<Product>[] = [
    {
      key: 'name', header: 'Product', sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.images[0] && (
            <img src={p.images[0]} alt={p.name} className="h-9 w-9 rounded-sm object-cover shrink-0" />
          )}
          <div>
            <p className="font-medium text-parmore-black text-xs">{p.name}</p>
            <p className="text-2xs text-parmore-slate capitalize">{p.subcategory ?? p.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (p) => (
        <span className={cn('px-2 py-0.5 rounded-full text-2xs font-medium capitalize', STATUS_CHIP[p.status])}>
          {p.status}
        </span>
      ),
    },
    {
      key: 'price', header: 'Price', align: 'right', sortable: true,
      render: (p) => (
        <span className="text-xs font-medium">${p.price}
          {p.compare_at_price && <span className="ml-1 text-zinc-400 line-through text-2xs">${p.compare_at_price}</span>}
        </span>
      ),
    },
    {
      key: 'flags', header: 'Flags',
      render: (p) => (
        <div className="flex gap-1">
          {p.featured    && <span className="px-1.5 py-0.5 bg-parmore-gold/15 text-yellow-800 rounded text-2xs">Featured</span>}
          {p.best_seller && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-2xs">Best Seller</span>}
          {p.new_arrival && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-2xs">New</span>}
        </div>
      ),
    },
    {
      key: 'actions', header: '', align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <a href={`/shop/${p.slug}`} target="_blank" rel="noreferrer" title="View on site" className="p-1.5 rounded-sm text-zinc-400 hover:text-parmore-black transition-colors">
            <Eye className="h-3.5 w-3.5" />
          </a>
          {canWrite && (
            <button onClick={() => openEditor(p)} title="Edit" className="p-1.5 rounded-sm text-zinc-400 hover:text-parmore-black transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {canPublish && p.status !== 'active' && (
            <button onClick={() => setStatus(p.id, 'active')} title="Publish" className="p-1.5 rounded-sm text-zinc-400 hover:text-emerald-600 transition-colors">
              <Globe className="h-3.5 w-3.5" />
            </button>
          )}
          {canPublish && p.status === 'active' && (
            <button onClick={() => setStatus(p.id, 'draft')} title="Unpublish" className="p-1.5 rounded-sm text-zinc-400 hover:text-amber-600 transition-colors">
              <Globe className="h-3.5 w-3.5" />
            </button>
          )}
          {canDelete && (
            <button onClick={() => setStatus(p.id, 'archived')} title="Archive" className="p-1.5 rounded-sm text-zinc-400 hover:text-red-500 transition-colors">
              <Archive className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const FILTERS: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Draft', value: 'draft' },
    { label: 'Archived', value: 'archived' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-parmore-black font-serif">Products</h1>
          <p className="text-xs text-parmore-slate mt-1">{products.length} total products</p>
        </div>
        {canWrite && (
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-1.5 px-4 py-2 bg-parmore-black text-white text-xs font-medium rounded-sm hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Product
          </button>
        )}
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {FILTERS.map((f) => {
          const count = f.value === 'all' ? products.length : products.filter((p) => p.status === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-sm text-xs font-medium transition-colors',
                filter === f.value
                  ? 'bg-parmore-black text-white'
                  : 'bg-white border border-zinc-200 text-parmore-slate hover:border-zinc-400'
              )}
            >
              {f.label} <span className="ml-1 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-sm border border-zinc-100 shadow-luxury">
        <Table<Product>
          columns={COLUMNS}
          data={visible}
          keyExtractor={(p) => p.id}
          emptyMessage="No products match this filter."
          onRowClick={canWrite ? openEditor : undefined}
        />
      </div>

      <ProductEditorModal
        isOpen={editorOpen}
        product={editing}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
