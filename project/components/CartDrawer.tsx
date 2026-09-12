'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useCart } from './CartProvider';
import { Button } from './ui/Button';
import { formatPriceRaw, freeShippingRemaining } from '@/app/lib/utils';

export function CartDrawer() {
  const { cart, closeCart, removeItem, updateQuantity } = useCart();

  const remaining = freeShippingRemaining(cart.subtotal);
  const freeShipProgress = Math.min(100, ((150 - remaining) / 150) * 100);

  return (
    <AnimatePresence>
      {cart.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl"
            role="dialog"
            aria-label="Shopping bag"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-parmore-black" strokeWidth={1.5} />
                <span className="font-serif text-base font-bold">Your Bag</span>
                {cart.item_count > 0 && (
                  <span className="text-xs text-parmore-slate">({cart.item_count} {cart.item_count === 1 ? 'item' : 'items'})</span>
                )}
              </div>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="p-1.5 rounded-sm text-parmore-slate hover:text-parmore-black hover:bg-zinc-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Free shipping bar */}
            {remaining > 0 && (
              <div className="px-5 py-3 bg-parmore-cream border-b border-zinc-100">
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-xs text-parmore-black">
                    Add{' '}
                    <span className="font-semibold text-parmore-gold">{formatPriceRaw(remaining)}</span>{' '}
                    more for free shipping
                  </p>
                </div>
                <div className="h-1 bg-white rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-parmore-gold rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${freeShipProgress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            {remaining <= 0 && cart.item_count > 0 && (
              <div className="px-5 py-2.5 bg-green-50 border-b border-green-100 text-xs text-green-700 font-medium flex items-center gap-1.5">
                <span>✓</span> You&apos;ve unlocked free shipping!
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.items.length === 0 ? (
                <EmptyCart closeCart={closeCart} />
              ) : (
                <ul className="space-y-5">
                  <AnimatePresence initial={false}>
                    {cart.items.map((item) => (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex gap-4"
                      >
                        {/* Image */}
                        <Link
                          href={`/shop/${item.product.slug}`}
                          onClick={closeCart}
                          className="shrink-0 w-20 h-24 rounded-sm overflow-hidden bg-parmore-cream"
                        >
                          <Image
                            src={item.color.images[0] ?? item.product.images[0]}
                            alt={item.product.name}
                            width={80}
                            height={96}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={`/shop/${item.product.slug}`}
                                onClick={closeCart}
                                className="text-sm font-medium text-parmore-black hover:text-parmore-gold transition-colors line-clamp-2 leading-snug"
                              >
                                {item.product.name}
                              </Link>
                              <button
                                aria-label="Remove item"
                                onClick={() => removeItem(item.id)}
                                className="shrink-0 p-0.5 text-zinc-300 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="text-xs text-parmore-slate mt-1">
                              {item.color.name} · {item.size}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            {/* Quantity */}
                            <div className="flex items-center border border-zinc-200 rounded-sm">
                              <button
                                aria-label="Decrease quantity"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center text-parmore-slate hover:text-parmore-black hover:bg-zinc-50 transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-medium">
                                {item.quantity}
                              </span>
                              <button
                                aria-label="Increase quantity"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center text-parmore-slate hover:text-parmore-black hover:bg-zinc-50 transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Price */}
                            <span className="text-sm font-semibold">
                              {formatPriceRaw(item.unit_price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Footer */}
            {cart.items.length > 0 && (
              <div className="border-t border-zinc-100 px-5 py-5 space-y-4">
                {/* Subtotal */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-parmore-slate">
                    <span>Subtotal</span>
                    <span>{formatPriceRaw(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-parmore-slate">
                    <span>Shipping</span>
                    <span>{remaining <= 0 ? 'Free' : 'Calculated at checkout'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-parmore-slate">
                    <span>Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between items-center font-semibold text-base pt-1 border-t border-zinc-100">
                    <span>Estimated Total</span>
                    <span>{formatPriceRaw(cart.subtotal)}</span>
                  </div>
                </div>

                {/* CTA */}
                <Button variant="primary" size="lg" fullWidth className="gap-2 group">
                  Checkout
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
                <button
                  onClick={closeCart}
                  className="w-full text-xs text-center text-parmore-slate hover:text-parmore-black transition-colors underline underline-offset-2"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function EmptyCart({ closeCart }: { closeCart: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-12 gap-5">
      <div className="w-16 h-16 rounded-full bg-parmore-cream flex items-center justify-center">
        <ShoppingBag className="h-7 w-7 text-parmore-slate" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-serif text-lg font-bold mb-1">Your bag is empty</p>
        <p className="text-sm text-parmore-slate max-w-[20ch] mx-auto">
          Discover our latest collection and find your perfect round.
        </p>
      </div>
      <Link
        href="/shop"
        onClick={closeCart}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-parmore-black text-white text-sm font-medium rounded-sm hover:bg-zinc-800 transition-colors"
      >
        Shop Collection
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
