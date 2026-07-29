"use client";

import React, { useState, useEffect } from "react";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Modal";

// Simplified generic types for the form state
type CartItem = {
  productId: string;
  variantId?: string;
  title: string;
  variantLabel?: string;
  quantity: number;
  unitPrice: number;
  maxStock: number;
};

export default function NewManualOrderPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [items, setItems] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<any[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [guestForm, setGuestForm] = useState({ name: "", email: "", phone: "", street: "", city: "", country: "SA" });
  
  const [channel, setChannel] = useState("WEBSITE");
  const [status, setStatus] = useState("PENDING");
  const [discountAmount, setDiscountAmount] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [forceGuest, setForceGuest] = useState(false);
  const [linkToUserId, setLinkToUserId] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<{ message: string, userId?: string, name?: string } | null>(null);

  // Search Products
  useEffect(() => {
    if (productSearch.length < 2) {
      setProductResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await fetch(`/api/admin/products?search=${encodeURIComponent(productSearch)}`);
        if (res.ok) {
          const json = await res.json();
          setProductResults(json.data || []);
        }
      } finally {
        setSearchingProducts(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Search Customers
  useEffect(() => {
    if (customerSearch.length < 2) {
      setCustomerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingCustomers(true);
      try {
        const res = await fetch(`/api/admin/customers/search?q=${encodeURIComponent(customerSearch)}`);
        if (res.ok) {
          const json = await res.json();
          setCustomerResults(json.data || []);
        }
      } finally {
        setSearchingCustomers(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const addProduct = (product: any, variant?: any) => {
    const existingIdx = items.findIndex(i => i.productId === product.id && i.variantId === variant?.id);
    const maxStock = variant ? variant.stockCount : product.inventoryCount;
    if (maxStock <= 0) {
      addToast("error", "Out of stock!");
      return;
    }

    if (existingIdx >= 0) {
      const newItems = [...items];
      if (newItems[existingIdx].quantity < maxStock) {
        newItems[existingIdx].quantity += 1;
        setItems(newItems);
      } else {
        addToast("error", `Only ${maxStock} in stock`);
      }
    } else {
      setItems([...items, {
        productId: product.id,
        variantId: variant?.id,
        title: product.title,
        variantLabel: variant ? `${variant.variantType}: ${variant.value}` : undefined,
        quantity: 1,
        unitPrice: variant?.priceModifier ? parseFloat(variant.priceModifier.toString()) : parseFloat(product.price.toString()),
        maxStock
      }]);
    }
    setProductSearch("");
  };

  const updateQuantity = (idx: number, delta: number) => {
    const newItems = [...items];
    const item = newItems[idx];
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      newItems.splice(idx, 1);
    } else if (newQty > item.maxStock) {
      addToast("error", `Only ${item.maxStock} in stock`);
      return;
    } else {
      item.quantity = newQty;
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      addToast("error", "Add at least one item to the order.");
      return;
    }

    setSubmitting(true);
    setConflictWarning(null);

    const payload = {
      cartItems: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      channel,
      status,
      discountAmount,
      guest: selectedCustomer ? undefined : {
        name: guestForm.name,
        email: guestForm.email,
        phone: guestForm.phone,
        address: { street: guestForm.street || "N/A", city: guestForm.city || "N/A", country: guestForm.country }
      },
      linkToUserId: selectedCustomer ? selectedCustomer.id : linkToUserId,
      forceGuest
    };

    try {
      const res = await fetch("/api/admin/orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.status === 409) {
        // Handle Duplicate Buyer 
        setConflictWarning({ message: data.error.message, userId: data.error.details?.userId, name: data.error.details?.name });
      } else if (!res.ok) {
        addToast("error", data.error?.message || "Failed to create order");
      } else {
        addToast("success", "Order created successfully!");
        router.push("/admin/orders");
      }
    } catch (e: any) {
      addToast("error", "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkAccept = () => {
    if (conflictWarning?.userId) {
      setLinkToUserId(conflictWarning.userId);
      setForceGuest(false);
      // We need a subtle timeout to let state update before auto-submitting, 
      // but simpler to just set state and let user click save again or trigger effect.
      // Easiest is to manually submit with the updated params here:
      triggerSubmitWithOverrides(conflictWarning.userId, false);
    }
  };

  const handleLinkReject = () => {
    setLinkToUserId(null);
    setForceGuest(true);
    triggerSubmitWithOverrides(null, true);
  };

  const triggerSubmitWithOverrides = async (linkedId: string | null, force: boolean) => {
    setSubmitting(true);
    setConflictWarning(null);
    const payload = {
      cartItems: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      channel,
      status,
      discountAmount,
      guest: {
        name: guestForm.name,
        email: guestForm.email,
        phone: guestForm.phone,
        address: { street: guestForm.street || "N/A", city: guestForm.city || "N/A", country: guestForm.country }
      },
      linkToUserId: linkedId,
      forceGuest: force
    };
    try {
      const res = await fetch("/api/admin/orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) addToast("error", data.error?.message || "Failed to create order");
      else {
        addToast("success", "Order created successfully!");
        router.push("/admin/orders");
      }
    } catch {
      addToast("error", "Network error");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] flex">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <Link href="/admin/orders" className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-brand-navy)] transition-colors">
            ← Back to Orders
          </Link>
          <h2 className="text-2xl font-bold text-[var(--color-brand-navy)] mt-2">New Manual Order</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Products Section */}
            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
              <h3 className="text-lg font-bold text-[var(--color-brand-navy)] mb-4">Items</h3>
              
              <div className="relative mb-6">
                <Input 
                  placeholder="Search products by title or SKU..." 
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
                {searchingProducts && <span className="absolute right-3 top-3 text-xs text-[var(--color-muted)]">Searching...</span>}
                
                {productResults.length > 0 && productSearch.length >= 2 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[var(--color-border)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {productResults.map(p => (
                      <div key={p.id} className="p-3 border-b border-[var(--color-border)] hover:bg-[var(--color-gray-50)]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm">{p.title}</span>
                          {!p.variants.length && (
                            <button type="button" onClick={() => addProduct(p)} className="text-xs bg-[var(--color-brand-navy)] text-white px-2 py-1 rounded">Add</button>
                          )}
                        </div>
                        {p.variants.length > 0 && (
                          <div className="flex gap-2 flex-wrap mt-2">
                            {p.variants.map((v: any) => (
                              <button type="button" key={v.id} onClick={() => addProduct(p, v)} className="text-xs border px-2 py-1 rounded hover:bg-[var(--color-brand-gold)] hover:text-white transition-colors">
                                {v.variantType}: {v.value} (Stock: {v.stockCount})
                              </button>
                            ))}
                          </div>
                        )}
                        {!p.variants.length && <span className="text-xs text-[var(--color-muted)]">Stock: {p.inventoryCount}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {items.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted)]">
                      <th className="pb-2">Product</th>
                      <th className="pb-2 text-center">Qty</th>
                      <th className="pb-2 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b border-[var(--color-border)] last:border-0">
                        <td className="py-3">
                          <p className="font-semibold">{item.title}</p>
                          {item.variantLabel && <p className="text-xs text-[var(--color-muted)]">{item.variantLabel}</p>}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button type="button" onClick={() => updateQuantity(idx, -1)} className="w-6 h-6 rounded bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">-</button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(idx, 1)} className="w-6 h-6 rounded bg-[var(--color-gray-100)] hover:bg-[var(--color-gray-200)]">+</button>
                          </div>
                        </td>
                        <td className="py-3 text-right">{(item.unitPrice * item.quantity).toFixed(2)} SAR</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-[var(--color-muted)] text-center py-4">No items added.</p>
              )}
            </div>

            {/* Conflict Warning */}
            {conflictWarning && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <h4 className="font-bold text-amber-800">Duplicate Buyer Detected</h4>
                <p className="text-sm text-amber-700 mt-1">{conflictWarning.message}</p>
                <div className="mt-3 flex gap-3">
                  {conflictWarning.userId && (
                    <button type="button" onClick={handleLinkAccept} className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded hover:bg-amber-700">
                      Link to {conflictWarning.name || "User"}
                    </button>
                  )}
                  <button type="button" onClick={handleLinkReject} className="px-3 py-1.5 bg-white text-amber-800 border border-amber-300 text-xs font-semibold rounded hover:bg-amber-100">
                    Create as Guest Anyway
                  </button>
                </div>
              </div>
            )}

            {/* Customer Section */}
            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
              <h3 className="text-lg font-bold text-[var(--color-brand-navy)] mb-4">Customer Details</h3>
              
              <div className="relative mb-6">
                <Input 
                  label="Search Existing Customer (Optional)"
                  placeholder="Name, email, or phone..." 
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  disabled={!!selectedCustomer}
                />
                {selectedCustomer && (
                  <button type="button" onClick={() => setSelectedCustomer(null)} className="absolute right-3 top-9 text-xs text-red-500 font-semibold">Clear</button>
                )}
                {searchingCustomers && <span className="absolute right-3 top-9 text-xs text-[var(--color-muted)]">Searching...</span>}
                
                {customerResults.length > 0 && customerSearch.length >= 2 && !selectedCustomer && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[var(--color-border)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {customerResults.map(u => (
                      <div key={u.id} className="p-3 border-b border-[var(--color-border)] hover:bg-[var(--color-gray-50)] cursor-pointer"
                           onClick={() => { setSelectedCustomer(u); setCustomerSearch(u.name); setCustomerResults([]); }}>
                        <span className="font-semibold text-sm">{u.name}</span>
                        <span className="text-xs text-[var(--color-muted)] ml-2">{u.email} • {u.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!selectedCustomer && (
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Name" value={guestForm.name} onChange={e => setGuestForm(f => ({ ...f, name: e.target.value }))} />
                  <Input label="Phone" value={guestForm.phone} onChange={e => setGuestForm(f => ({ ...f, phone: e.target.value }))} />
                  <Input label="Email" value={guestForm.email} onChange={e => setGuestForm(f => ({ ...f, email: e.target.value }))} />
                  <Input label="City" value={guestForm.city} onChange={e => setGuestForm(f => ({ ...f, city: e.target.value }))} />
                  <div className="col-span-2">
                    <Input label="Street Address" value={guestForm.street} onChange={e => setGuestForm(f => ({ ...f, street: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
              <h3 className="text-lg font-bold text-[var(--color-brand-navy)] mb-4">Order Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-foreground)] mb-1">Sales Channel</label>
                  <select value={channel} onChange={e => setChannel(e.target.value)} className="w-full bg-[var(--color-gray-50)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-gold)]">
                    <option value="WEBSITE">Website</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="TIKTOK">TikTok</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-foreground)] mb-1">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-[var(--color-gray-50)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-gold)]">
                    <option value="PENDING">Pending (Payment Due)</option>
                    <option value="PAID">Paid (Ready to Pack)</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </div>
                <Input type="number" label="Manual Discount (SAR)" min={0} value={discountAmount} onChange={e => setDiscountAmount(Number(e.target.value))} />
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--color-border)] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-muted)]">Subtotal</span>
                  <span>{subtotal.toFixed(2)} SAR</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{discountAmount.toFixed(2)} SAR</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-[var(--color-border)]">
                  <span>Total</span>
                  <span>{total.toFixed(2)} SAR</span>
                </div>
              </div>

              <Button type="submit" variant="primary" fullWidth className="mt-6" loading={submitting}>
                Create Order
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
