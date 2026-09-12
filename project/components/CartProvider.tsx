'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { Cart, CartItem, Product, ProductVariant, ProductColor } from '@/app/lib/types';
import { calcCartTotals } from '@/app/lib/utils';

interface CartState extends Cart {
  isOpen: boolean;
}

type CartAction =
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id'> }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'OPEN_CART':
      return { ...state, isOpen: true };

    case 'CLOSE_CART':
      return { ...state, isOpen: false };

    case 'ADD_ITEM': {
      const existing = state.items.find(
        (i) =>
          i.product_id === action.payload.product_id &&
          i.variant_id === action.payload.variant_id &&
          i.size === action.payload.size
      );

      let newItems: CartItem[];
      if (existing) {
        newItems = state.items.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + action.payload.quantity } : i
        );
      } else {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        newItems = [...state.items, { ...action.payload, id }];
      }

      const totals = calcCartTotals(newItems);
      return { ...state, items: newItems, ...totals, isOpen: true };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter((i) => i.id !== action.payload.id);
      return { ...state, items: newItems, ...calcCartTotals(newItems) };
    }

    case 'UPDATE_QUANTITY': {
      const newItems =
        action.payload.quantity <= 0
          ? state.items.filter((i) => i.id !== action.payload.id)
          : state.items.map((i) =>
              i.id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i
            );
      return { ...state, items: newItems, ...calcCartTotals(newItems) };
    }

    case 'CLEAR_CART':
      return { ...state, items: [], subtotal: 0, item_count: 0 };

    default:
      return state;
  }
}

const initialState: CartState = {
  items: [],
  subtotal: 0,
  item_count: 0,
  isOpen: false,
};

interface CartContextValue {
  cart: CartState;
  openCart: () => void;
  closeCart: () => void;
  addItem: (
    product: Product,
    variant: ProductVariant,
    color: ProductColor,
    size: string,
    quantity?: number
  ) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, initialState);

  const openCart = useCallback(() => dispatch({ type: 'OPEN_CART' }), []);
  const closeCart = useCallback(() => dispatch({ type: 'CLOSE_CART' }), []);

  const addItem = useCallback(
    (
      product: Product,
      variant: ProductVariant,
      color: ProductColor,
      size: string,
      quantity = 1
    ) => {
      const unitPrice = variant.price_override ?? product.price;
      dispatch({
        type: 'ADD_ITEM',
        payload: {
          product_id: product.id,
          variant_id: variant.id,
          product,
          variant,
          color,
          size,
          quantity,
          unit_price: unitPrice,
        },
      });
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  }, []);

  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  return (
    <CartContext.Provider
      value={{ cart, openCart, closeCart, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
