"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  productId: string;
  variantId?: string;
  title: string;
  titleAr?: string;
  image: string;
  slug: string;
  price: number;
  variantLabel?: string;
  quantity: number;
  sku: string;
}

interface CartState {
  items: CartItem[];
  coupon: { code: string; discountAmount: number; newTotal: number } | null;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { productId: string; variantId?: string } }
  | { type: "UPDATE_QTY"; payload: { productId: string; variantId?: string; quantity: number } }
  | { type: "APPLY_COUPON"; payload: { code: string; discountAmount: number; newTotal: number } }
  | { type: "REMOVE_COUPON" }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartState };

// ── Reducer ───────────────────────────────────────────────────────────────────
function itemKey(productId: string, variantId?: string) {
  return `${productId}__${variantId ?? ""}`;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const key = itemKey(action.payload.productId, action.payload.variantId);
      const existing = state.items.find(
        (i) => itemKey(i.productId, i.variantId) === key
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            itemKey(i.productId, i.variantId) === key
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
          coupon: null, // reset coupon on cart change
        };
      }
      return { ...state, items: [...state.items, action.payload], coupon: null };
    }
    case "REMOVE_ITEM": {
      const key = itemKey(action.payload.productId, action.payload.variantId);
      return {
        ...state,
        items: state.items.filter((i) => itemKey(i.productId, i.variantId) !== key),
        coupon: null,
      };
    }
    case "UPDATE_QTY": {
      const key = itemKey(action.payload.productId, action.payload.variantId);
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => itemKey(i.productId, i.variantId) !== key), coupon: null };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          itemKey(i.productId, i.variantId) === key ? { ...i, quantity: action.payload.quantity } : i
        ),
        coupon: null,
      };
    }
    case "APPLY_COUPON":
      return { ...state, coupon: action.payload };
    case "REMOVE_COUPON":
      return { ...state, coupon: null };
    case "CLEAR_CART":
      return { items: [], coupon: null };
    case "LOAD_CART":
      return action.payload;
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
interface CartContextValue {
  items: CartItem[];
  coupon: CartState["coupon"];
  itemCount: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQty: (productId: string, quantity: number, variantId?: string) => void;
  applyCoupon: (code: string, discountAmount: number, newTotal: number) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = "rawaq_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], coupon: null });
  const [isOpen, setIsOpen] = React.useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) dispatch({ type: "LOAD_CART", payload: JSON.parse(saved) });
    } catch {}
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        coupon: state.coupon,
        itemCount,
        subtotal,
        addItem: (item) => dispatch({ type: "ADD_ITEM", payload: item }),
        removeItem: (productId, variantId) => dispatch({ type: "REMOVE_ITEM", payload: { productId, variantId } }),
        updateQty: (productId, quantity, variantId) => dispatch({ type: "UPDATE_QTY", payload: { productId, variantId, quantity } }),
        applyCoupon: (code, discountAmount, newTotal) => dispatch({ type: "APPLY_COUPON", payload: { code, discountAmount, newTotal } }),
        removeCoupon: () => dispatch({ type: "REMOVE_COUPON" }),
        clearCart: () => dispatch({ type: "CLEAR_CART" }),
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
