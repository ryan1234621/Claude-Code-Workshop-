'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Minus, Plus, Heart, Share2,
  ShoppingBag, Ruler, RotateCcw, Shield, Truck, ChevronDown,
} from 'lucide-react';
import { MOCK_PRODUCTS } from '@/app/lib/mockData';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useCart } from '@/components/CartProvider';
import { formatPriceRaw, discountPercent, getProductBadge } from '@/app/lib/utils';
import { cn } from '@/app/lib/utils';
import type { Product, ProductVariant } from '@/app/lib/types';

type AccordionKey = 'details' | 'care' | 'shipping' | 'fit';

interface ProductPageClientProps {
  product: Product;
  children?: React.ReactNode;
}

export function ProductPageClient({ product, children }: ProductPageClientProps) {
  const { addItem } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants[0] ?? null
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [accordion, setAccordion] = useState<AccordionKey | null>('details');
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const handleAddToBag = useCallback(() => {
    if (!selectedVariant) return;
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }
    addItem(product, selectedVariant, selectedVariant.color, selectedSize, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  }, [product, selectedVariant, selectedSize, quantity, addItem]);

  const badge = getProductBadge(product);
  const currentImages = selectedVariant?.color.images.length
    ? selectedVariant.color.images
    : product.images;

  const availableSizes = selectedVariant?.sizes ?? [];
  const relatedProducts = MOCK_PRODUCTS
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const toggleAccordion = (key: AccordionKey) =>
    setAccordion((prev) => (prev === key ? null : key));

  return (
    <div className="pt-[var(--navbar-height)] pb-20">
      {/* Breadcrumb */}
      <div className="container-parmore py-4">
        <nav className="flex items-center gap-2 text-xs text-parmore-slate">
          <Link href="/" className="hover:text-parmore-black transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/shop" className="hover:text-parmore-black transition-colors">Shop</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/shop?category=${product.category}`} className="hover:text-parmore-black transition-colors capitalize">{product.category}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-parmore-black truncate max-w-[20ch]">{product.name}</span>
        </nav>
      </div>

      <div className="container-parmore">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">

          {/* ─── Image Gallery ───────────────────────────────────────── */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative aspect-[4/5] bg-parmore-cream rounded-sm overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedVariant?.id}-${mainImageIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={currentImages[mainImageIndex] ?? product.images[0]}
                    alt={`${product.name} — ${selectedVariant?.color.name ?? ''}`}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Badge */}
              {badge && (
                <div className="absolute top-4 left-4">
                  <Badge variant={badge === 'New' ? 'new' : badge === 'Best Seller' ? 'bestseller' : 'sale'}>
                    {badge}
                  </Badge>
                </div>
              )}

              {/* Gallery nav */}
              {currentImages.length > 1 && (
                <>
                  <button
                    onClick={() => setMainImageIndex((i) => Math.max(0, i - 1))}
                    disabled={mainImageIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors disabled:opacity-30"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setMainImageIndex((i) => Math.min(currentImages.length - 1, i + 1))}
                    disabled={mainImageIndex === currentImages.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors disabled:opacity-30"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Dot indicators */}
              {currentImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {currentImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImageIndex(i)}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i === mainImageIndex ? 'bg-parmore-black w-4' : 'bg-black/30 w-1.5'
                      )}
                      aria-label={`View image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {currentImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {currentImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setMainImageIndex(i)}
                    className={cn(
                      'relative aspect-square rounded-sm overflow-hidden bg-parmore-cream transition-all',
                      i === mainImageIndex ? 'ring-2 ring-parmore-black' : 'ring-1 ring-transparent hover:ring-zinc-300'
                    )}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── Product Info ─────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="space-y-6">
              {/* Title & price */}
              <div>
                <p className="label-caps text-parmore-slate mb-2">
                  {product.subcategory ?? product.category}
                </p>
                <h1 className="heading-1 mb-3">{product.name}</h1>
                <div className="flex items-baseline gap-3">
                  <span className={cn('text-2xl font-semibold', product.compare_at_price && 'text-red-600')}>
                    {formatPriceRaw(product.price)}
                  </span>
                  {product.compare_at_price && (
                    <>
                      <span className="text-parmore-slate line-through text-base">
                        {formatPriceRaw(product.compare_at_price)}
                      </span>
                      <Badge variant="sale">
                        {discountPercent(product.compare_at_price, product.price)}% Off
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-parmore-slate text-sm leading-relaxed">{product.description}</p>

              {/* Color selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">
                    Color: <span className="font-normal text-parmore-slate">{selectedVariant?.color.name}</span>
                  </span>
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      title={variant.color.name}
                      onClick={() => {
                        setSelectedVariant(variant);
                        setMainImageIndex(0);
                        setSelectedSize(null);
                      }}
                      className={cn(
                        'relative h-9 w-9 rounded-full transition-all',
                        selectedVariant?.id === variant.id
                          ? 'ring-2 ring-offset-2 ring-parmore-black'
                          : 'ring-1 ring-zinc-200 hover:ring-parmore-slate'
                      )}
                      style={{ backgroundColor: variant.color.hex }}
                    >
                      {variant.color.hex === '#f8f8f8' && (
                        <span className="absolute inset-0 rounded-full border border-zinc-200" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={cn('text-sm font-semibold', sizeError && 'text-red-500')}>
                    {sizeError ? 'Please select a size' : 'Size'}
                  </span>
                  <button className="flex items-center gap-1 text-xs text-parmore-slate hover:text-parmore-gold transition-colors">
                    <Ruler className="h-3 w-3" /> Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map(({ label, stock }) => {
                    const outOfStock = stock === 0;
                    return (
                      <button
                        key={label}
                        disabled={outOfStock}
                        onClick={() => { setSelectedSize(label); setSizeError(false); }}
                        className={cn(
                          'h-10 min-w-[3rem] px-3 rounded-sm text-sm font-medium transition-all border',
                          selectedSize === label
                            ? 'bg-parmore-black text-white border-parmore-black'
                            : outOfStock
                            ? 'border-zinc-200 text-zinc-300 cursor-not-allowed line-through'
                            : 'border-zinc-200 text-parmore-black hover:border-parmore-black',
                          sizeError && !selectedSize && !outOfStock && 'border-red-300'
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity + Add to bag */}
              <div className="flex gap-3">
                {/* Qty */}
                <div className="flex items-center border border-zinc-200 rounded-sm">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-12 flex items-center justify-center text-parmore-slate hover:text-parmore-black transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="w-10 h-12 flex items-center justify-center text-parmore-slate hover:text-parmore-black transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Add to bag */}
                <Button
                  variant={addedFeedback ? 'secondary' : 'primary'}
                  size="lg"
                  fullWidth
                  onClick={handleAddToBag}
                  className="gap-2 flex-1 group"
                >
                  <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                  {addedFeedback ? 'Added to Bag!' : 'Add to Bag'}
                </Button>

                {/* Wishlist */}
                <button
                  onClick={() => setWishlisted((prev) => !prev)}
                  aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  className={cn(
                    'h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-sm border transition-all',
                    wishlisted
                      ? 'border-red-200 bg-red-50 text-red-500'
                      : 'border-zinc-200 text-parmore-slate hover:border-parmore-black hover:text-parmore-black'
                  )}
                >
                  <Heart
                    className="h-5 w-5"
                    fill={wishlisted ? 'currentColor' : 'none'}
                    strokeWidth={1.5}
                  />
                </button>
              </div>

              {/* Trust signals */}
              <div className="grid grid-cols-3 gap-3 py-4 border-y border-zinc-100">
                {[
                  { icon: Truck, label: 'Free Ship', sub: 'Over $150' },
                  { icon: RotateCcw, label: 'Free Returns', sub: '30 days' },
                  { icon: Shield, label: 'Secure', sub: 'Checkout' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex flex-col items-center text-center gap-1">
                    <Icon className="h-4 w-4 text-parmore-gold" strokeWidth={1.5} />
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="text-2xs text-parmore-slate">{sub}</span>
                  </div>
                ))}
              </div>

              {/* Share */}
              <button className="flex items-center gap-2 text-xs text-parmore-slate hover:text-parmore-black transition-colors">
                <Share2 className="h-3.5 w-3.5" />
                Share this product
              </button>

              {/* Accordions */}
              <div className="space-y-px border-t border-zinc-100">
                {[
                  {
                    key: 'details' as AccordionKey,
                    label: 'Product Details',
                    content: (
                      <div className="text-sm text-parmore-slate space-y-2">
                        <p>{product.description}</p>
                        {product.materials && <p><span className="font-medium text-parmore-black">Materials:</span> {product.materials}</p>}
                      </div>
                    ),
                  },
                  {
                    key: 'care' as AccordionKey,
                    label: 'Care Instructions',
                    content: (
                      <p className="text-sm text-parmore-slate">{product.care_instructions ?? 'See garment label for care instructions.'}</p>
                    ),
                  },
                  {
                    key: 'fit' as AccordionKey,
                    label: 'Fit & Sizing',
                    content: (
                      <p className="text-sm text-parmore-slate">{product.fit_guide ?? 'See our size guide for detailed measurements.'}</p>
                    ),
                  },
                  {
                    key: 'shipping' as AccordionKey,
                    label: 'Shipping & Returns',
                    content: (
                      <div className="text-sm text-parmore-slate space-y-1">
                        <p>Free standard shipping on orders over $150.</p>
                        <p>Standard shipping: 3–5 business days.</p>
                        <p>Express shipping: 1–2 business days.</p>
                        <p>Free returns within 30 days of delivery.</p>
                      </div>
                    ),
                  },
                ].map(({ key, label, content }) => (
                  <div key={key} className="border-b border-zinc-100">
                    <button
                      onClick={() => toggleAccordion(key)}
                      className="w-full flex items-center justify-between py-4 text-sm font-medium text-left hover:text-parmore-gold transition-colors"
                    >
                      {label}
                      <ChevronDown
                        className={cn('h-4 w-4 text-parmore-slate transition-transform flex-shrink-0', accordion === key && 'rotate-180')}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {accordion === key && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="pb-4">{content}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Related Products ────────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-zinc-100">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="label-caps text-parmore-gold mb-2">You May Also Like</p>
                <h2 className="heading-2">Related Products</h2>
              </div>
              <Link href={`/shop?category=${product.category}`} className="text-sm font-medium text-parmore-black hover:text-parmore-gold transition-colors flex items-center gap-1">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ─── SEO Content (specs + FAQ) ────────────────────────── */}
        {children}
      </div>
    </div>
  );
}
