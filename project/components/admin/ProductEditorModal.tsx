'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Product, ProductCategory, ProductStatus, ProductVariant, ProductSize } from '@/app/lib/types';
import { cn } from '@/app/lib/utils';

interface ProductEditorModalProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Product>) => Promise<void>;
}

const CATEGORIES: ProductCategory[] = ['apparel', 'headwear', 'accessories'];
const SUBCATEGORIES: Record<ProductCategory, string[]> = {
  apparel:     ['polo', 'pants', 'shorts', 'quarter-zip', 'jacket', 'base-layer'],
  headwear:    ['snapback', 'fitted', 'bucket', 'visor', 'beanie'],
  accessories: ['belt', 'glove', 'bag', 'towel', 'socks', 'other'],
};
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'OSFM'];
const STATUS_OPTIONS: ProductStatus[] = ['active', 'draft', 'archived'];

const STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Active', draft: 'Draft', archived: 'Archived',
};

function Section({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-zinc-200 rounded-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 text-xs font-semibold tracking-wider uppercase text-parmore-slate hover:text-parmore-black transition-colors"
      >
        {title}
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-2xs font-semibold text-parmore-slate mb-1 uppercase tracking-wider">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLS = 'w-full px-3 h-9 border border-zinc-200 rounded-sm text-sm bg-white focus:outline-none focus:border-parmore-black transition-colors';
const TEXTAREA_CLS = 'w-full px-3 py-2 border border-zinc-200 rounded-sm text-sm bg-white focus:outline-none focus:border-parmore-black transition-colors resize-none';

type EditorVariant = { id: string; colorName: string; colorHex: string; sku: string; sizes: { label: string; stock: number }[] };

function emptyVariant(): EditorVariant {
  return { id: `v-${Date.now()}`, colorName: '', colorHex: '#000000', sku: '', sizes: SIZE_OPTIONS.map((l) => ({ label: l, stock: 0 })) };
}

function variantFromProduct(v: ProductVariant): EditorVariant {
  return {
    id: v.id,
    colorName: v.color.name,
    colorHex: v.color.hex,
    sku: v.sku,
    sizes: SIZE_OPTIONS.map((l) => {
      const existing = v.sizes.find((s) => s.label === l);
      return { label: l, stock: existing?.stock ?? 0 };
    }),
  };
}

export function ProductEditorModal({ product, isOpen, onClose, onSave }: ProductEditorModalProps) {
  const isEdit = !!product;

  // Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('apparel');
  const [subcategory, setSubcategory] = useState('');
  const [materials, setMaterials] = useState('');

  // Pricing
  const [price, setPrice] = useState('');
  const [compareAt, setCompareAt] = useState('');

  // Variants
  const [variants, setVariants] = useState<EditorVariant[]>([emptyVariant()]);

  // Publishing
  const [status, setStatus] = useState<ProductStatus>('draft');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [newArrival, setNewArrival] = useState(false);

  // UI
  const [sections, setSections] = useState({ basic: true, pricing: true, variants: true, publishing: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (product) {
      setName(product.name);
      setDescription(product.description);
      setCategory(product.category);
      setSubcategory(product.subcategory ?? '');
      setMaterials(product.materials ?? '');
      setPrice(String(product.price));
      setCompareAt(product.compare_at_price ? String(product.compare_at_price) : '');
      setVariants(product.variants.length > 0 ? product.variants.map(variantFromProduct) : [emptyVariant()]);
      setStatus(product.status);
      setTags([...product.tags]);
      setFeatured(product.featured);
      setBestSeller(product.best_seller);
      setNewArrival(product.new_arrival);
    } else {
      setName(''); setDescription(''); setCategory('apparel'); setSubcategory('');
      setMaterials(''); setPrice(''); setCompareAt('');
      setVariants([emptyVariant()]); setStatus('draft'); setTags([]);
      setFeatured(false); setBestSeller(false); setNewArrival(false);
    }
    setError('');
  }, [isOpen, product]);

  const toggleSection = (key: keyof typeof sections) =>
    setSections((s) => ({ ...s, [key]: !s[key] }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const updateVariant = (id: string, patch: Partial<EditorVariant>) =>
    setVariants((vs) => vs.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const updateVariantSize = (variantId: string, sizeLabel: string, stock: number) =>
    setVariants((vs) =>
      vs.map((v) =>
        v.id === variantId
          ? { ...v, sizes: v.sizes.map((s) => (s.label === sizeLabel ? { ...s, stock } : s)) }
          : v
      )
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Product name is required.'); return; }
    if (!price || isNaN(parseFloat(price))) { setError('Valid price is required.'); return; }

    const data: Partial<Product> = {
      name: name.trim(),
      description: description.trim(),
      category,
      subcategory: subcategory || undefined,
      materials: materials || undefined,
      price: parseFloat(price),
      compare_at_price: compareAt ? parseFloat(compareAt) : undefined,
      variants: variants
        .filter((v) => v.colorName.trim())
        .map((v) => ({
          id: v.id,
          product_id: product?.id ?? '',
          sku: v.sku,
          color: { name: v.colorName, hex: v.colorHex, images: [] },
          sizes: v.sizes.filter((s) => s.stock > 0),
        })),
      tags,
      status,
      featured,
      best_seller: bestSeller,
      new_arrival: newArrival,
    };

    setSaving(true);
    try {
      await onSave(data);
      onClose();
    } catch {
      setError('Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="pem-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.aside
            key="pem-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 38 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 shrink-0">
              <div>
                <h2 className="text-sm font-bold text-parmore-black">
                  {isEdit ? 'Edit Product' : 'Add Product'}
                </h2>
                {isEdit && <p className="text-xs text-parmore-slate mt-0.5">{product?.name}</p>}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-sm text-zinc-400 hover:text-parmore-black transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">

                {/* Basic Info */}
                <Section title="Basic Info" open={sections.basic} onToggle={() => toggleSection('basic')}>
                  <Field label="Product Name" required>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLS} placeholder="e.g. Fairway Performance Polo" />
                  </Field>
                  <Field label="Description">
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={TEXTAREA_CLS} placeholder="Describe the product…" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Category" required>
                      <select value={category} onChange={(e) => { setCategory(e.target.value as ProductCategory); setSubcategory(''); }} className={INPUT_CLS}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                    </Field>
                    <Field label="Subcategory">
                      <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className={INPUT_CLS}>
                        <option value="">— None —</option>
                        {SUBCATEGORIES[category].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Materials">
                    <input type="text" value={materials} onChange={(e) => setMaterials(e.target.value)} className={INPUT_CLS} placeholder="e.g. 92% Polyester, 8% Elastane" />
                  </Field>
                </Section>

                {/* Pricing */}
                <Section title="Pricing" open={sections.pricing} onToggle={() => toggleSection('pricing')}>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Price (USD)" required>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-parmore-slate">$</span>
                        <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={cn(INPUT_CLS, 'pl-6')} placeholder="0.00" />
                      </div>
                    </Field>
                    <Field label="Compare-at Price">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-parmore-slate">$</span>
                        <input type="number" min="0" step="0.01" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} className={cn(INPUT_CLS, 'pl-6')} placeholder="0.00" />
                      </div>
                    </Field>
                  </div>
                  <p className="text-2xs text-parmore-slate">Leave Compare-at blank to hide the strikethrough price.</p>
                </Section>

                {/* Variants */}
                <Section title="Variants" open={sections.variants} onToggle={() => toggleSection('variants')}>
                  {variants.map((v, vi) => (
                    <div key={v.id} className="border border-zinc-200 rounded-sm p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-parmore-black">Color Variant {vi + 1}</p>
                        {variants.length > 1 && (
                          <button type="button" onClick={() => setVariants((vs) => vs.filter((x) => x.id !== v.id))} className="text-zinc-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <Field label="Color Name">
                          <input type="text" value={v.colorName} onChange={(e) => updateVariant(v.id, { colorName: e.target.value })} className={INPUT_CLS} placeholder="e.g. Navy" />
                        </Field>
                        <Field label="Hex">
                          <div className="flex gap-2 items-center">
                            <input type="color" value={v.colorHex} onChange={(e) => updateVariant(v.id, { colorHex: e.target.value })} className="h-9 w-9 border border-zinc-200 rounded-sm cursor-pointer p-0.5" />
                            <input type="text" value={v.colorHex} onChange={(e) => updateVariant(v.id, { colorHex: e.target.value })} className={cn(INPUT_CLS, 'font-mono text-xs')} />
                          </div>
                        </Field>
                        <Field label="SKU">
                          <input type="text" value={v.sku} onChange={(e) => updateVariant(v.id, { sku: e.target.value })} className={cn(INPUT_CLS, 'font-mono text-xs')} placeholder="ABC-123" />
                        </Field>
                      </div>
                      <div>
                        <p className="text-2xs font-semibold text-parmore-slate uppercase tracking-wider mb-2">Stock by Size</p>
                        <div className="grid grid-cols-7 gap-1.5">
                          {v.sizes.map((s) => (
                            <div key={s.label} className="text-center">
                              <p className="text-2xs text-parmore-slate mb-1">{s.label}</p>
                              <input
                                type="number" min="0" value={s.stock}
                                onChange={(e) => updateVariantSize(v.id, s.label, parseInt(e.target.value) || 0)}
                                className="w-full px-1 h-8 border border-zinc-200 rounded-sm text-xs text-center bg-white focus:outline-none focus:border-parmore-black"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setVariants([...variants, emptyVariant()])}
                    className="flex items-center gap-1.5 text-xs text-parmore-slate hover:text-parmore-black transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Color Variant
                  </button>
                </Section>

                {/* Publishing */}
                <Section title="Publishing" open={sections.publishing} onToggle={() => toggleSection('publishing')}>
                  <Field label="Status">
                    <div className="flex gap-2">
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s} type="button"
                          onClick={() => setStatus(s)}
                          className={cn(
                            'px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors',
                            status === s
                              ? 'bg-parmore-black text-white border-parmore-black'
                              : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                          )}
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Tags">
                    <div className="flex gap-2">
                      <input
                        type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                        className={cn(INPUT_CLS, 'flex-1')} placeholder="Add tag and press Enter…"
                      />
                      <button type="button" onClick={addTag} className="px-3 h-9 bg-zinc-100 rounded-sm text-xs text-parmore-slate hover:bg-zinc-200 transition-colors">Add</button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {tags.map((t) => (
                          <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-parmore-cream rounded-full text-2xs text-parmore-black">
                            {t}
                            <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="text-zinc-400 hover:text-red-500">
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </Field>

                  <Field label="Flags">
                    <div className="flex flex-wrap gap-3">
                      {[
                        { key: 'featured', label: 'Featured', val: featured, set: setFeatured },
                        { key: 'bestSeller', label: 'Best Seller', val: bestSeller, set: setBestSeller },
                        { key: 'newArrival', label: 'New Arrival', val: newArrival, set: setNewArrival },
                      ].map(({ key, label, val, set }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                          <div
                            onClick={() => set(!val)}
                            className={cn(
                              'h-4 w-4 rounded border-2 flex items-center justify-center transition-colors',
                              val ? 'bg-parmore-black border-parmore-black' : 'border-zinc-300'
                            )}
                          >
                            {val && <span className="text-white text-2xs font-bold">✓</span>}
                          </div>
                          <span className="text-xs text-parmore-black">{label}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                </Section>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2">{error}</p>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-zinc-200 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-parmore-slate hover:text-parmore-black transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                form=""
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 bg-parmore-black text-white text-sm font-medium rounded-sm hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEdit ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
