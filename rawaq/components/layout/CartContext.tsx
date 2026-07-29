"use client";

import React, { createContext, useContext, useReducer, useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  id?: string; // DB ID if present
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
  loading: boolean;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => Promise<void>;
  updateQty: (productId: string, quantity: number, variantId?: string) => Promise<void>;
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
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  // Initialize cart (sync local and remote)
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const userRes = await fetch("/api/auth/me");
        const userData = await userRes.json();
        const loggedIn = !!userData.data?.user;
        if (mounted) setIsAuth(loggedIn);

        if (loggedIn) {
          // 1. Fetch DB Cart
          const cartRes = await fetch("/api/cart");
          const cartData = await cartRes.json();
          let dbItems: CartItem[] = (cartData.data?.items || []).map((dbItem: any) => ({
            id: dbItem.id,
            productId: dbItem.productId,
            variantId: dbItem.variantId ?? undefined,
            quantity: dbItem.quantity,
            title: dbItem.product.title,
            titleAr: dbItem.product.titleAr,
            slug: dbItem.product.slug,
            image: dbItem.product.images[0] ?? "",
            price: dbItem.variant?.priceModifier ?? dbItem.product.salePrice ?? dbItem.product.price,
            sku: dbItem.product.sku,
            variantLabel: dbItem.variant ? `${dbItem.variant.variantType}: ${dbItem.variant.value}` : undefined,
          }));

          // 2. Merge local cart into DB cart if local exists
          const savedStr = localStorage.getItem(CART_STORAGE_KEY);
          if (savedStr) {
            const savedState = JSON.parse(savedStr) as CartState;
            if (savedState.items && savedState.items.length > 0) {
              for (const localItem of savedState.items) {
                // Post to DB
                await fetch("/api/cart/items", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    productId: localItem.productId,
                    variantId: localItem.variantId,
                    quantity: localItem.quantity,
                  }),
                });
              }
              // Clear local storage after successful merge
              localStorage.removeItem(CART_STORAGE_KEY);
              
              // Refetch DB cart to get the merged result
              const refetchRes = await fetch("/api/cart");
              const refetchData = await refetchRes.json();
              dbItems = (refetchData.data?.items || []).map((dbItem: any) => ({
                id: dbItem.id,
                productId: dbItem.productId,
                variantId: dbItem.variantId ?? undefined,
                quantity: dbItem.quantity,
                title: dbItem.product.title,
                titleAr: dbItem.product.titleAr,
                slug: dbItem.product.slug,
                image: dbItem.product.images[0] ?? "",
                price: dbItem.variant?.priceModifier ?? dbItem.product.salePrice ?? dbItem.product.price,
                sku: dbItem.product.sku,
                variantLabel: dbItem.variant ? `${dbItem.variant.variantType}: ${dbItem.variant.value}` : undefined,
              }));
            }
          }

          if (mounted) dispatch({ type: "LOAD_CART", payload: { items: dbItems, coupon: null } });
        } else {
          // Guest: Just load local storage
          const savedStr = localStorage.getItem(CART_STORAGE_KEY);
          if (savedStr) {
            if (mounted) dispatch({ type: "LOAD_CART", payload: JSON.parse(savedStr) });
          }
        }
      } catch (err) {
        console.error("Failed to init cart:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  // Persist to localStorage if guest
  useEffect(() => {
    if (!loading && !isAuth) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
      } catch {}
    }
  }, [state, isAuth, loading]);

  const addItem = async (item: CartItem) => {
    dispatch({ type: "ADD_ITEM", payload: item });
    if (isAuth) {
      try {
        await fetch("/api/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          }),
        });
      } catch (err) { console.error("Failed to sync add item", err); }
    }
  };

  const removeItem = async (productId: string, variantId?: string) => {
    // We need the DB ID to remove if auth'd. Let's find it in state first.
    const item = state.items.find(i => itemKey(i.productId, i.variantId) === itemKey(productId, variantId));
    dispatch({ type: "REMOVE_ITEM", payload: { productId, variantId } });
    
    if (isAuth && item?.id) {
      try {
        await fetch(`/api/cart/items/${item.id}`, { method: "DELETE" });
      } catch (err) { console.error("Failed to sync remove item", err); }
    } else if (isAuth) {
       // Fallback: If id is missing, we might need to refetch cart to find it and delete.
       // The DB handles cartItem.id, but the state might not have it immediately if we just added it.
       // In a full robust app, we'd wait for POST to return the ID. For now this best-effort syncs.
    }
  };

  const updateQty = async (productId: string, quantity: number, variantId?: string) => {
    const item = state.items.find(i => itemKey(i.productId, i.variantId) === itemKey(productId, variantId));
    dispatch({ type: "UPDATE_QTY", payload: { productId, variantId, quantity } });
    
    if (isAuth && item?.id) {
      try {
        if (quantity <= 0) {
          await fetch(`/api/cart/items/${item.id}`, { method: "DELETE" });
        } else {
          await fetch(`/api/cart/items/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity }),
          });
        }
      } catch (err) { console.error("Failed to sync update qty", err); }
    }
  };

  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        coupon: state.coupon,
        itemCount,
        subtotal,
        loading,
        addItem,
        removeItem,
        updateQty,
        applyCoupon: (code, discountAmount, newTotal) => dispatch({ type: "APPLY_COUPON", payload: { code, discountAmount, newTotal } }),
        removeCoupon: () => dispatch({ type: "REMOVE_COUPON" }),
        clearCart: () => {
           dispatch({ type: "CLEAR_CART" });
           if (!isAuth) localStorage.removeItem(CART_STORAGE_KEY);
           // Not clearing DB cart here. Usually done at checkout success.
        },
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
