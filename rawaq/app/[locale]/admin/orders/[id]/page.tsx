"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/Button";
import { useToast, Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { PriceTag } from "@/components/ui/Badge";

const STATUSES = ["PENDING", "PAID", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
const STATUS_COLORS: Record<string, string> = {
  PENDING:          "bg-amber-100 text-amber-800",
  PAID:             "bg-blue-100 text-blue-800",
  PACKED:           "bg-indigo-100 text-indigo-800",
  SHIPPED:          "bg-purple-100 text-purple-800",
  OUT_FOR_DELIVERY: "bg-fuchsia-100 text-fuchsia-800",
  DELIVERED:        "bg-green-100 text-green-800",
  CANCELLED:        "bg-red-100 text-red-800",
};
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING:          ["PAID", "CANCELLED"],
  PAID:             ["PACKED", "SHIPPED", "CANCELLED"],
  PACKED:           ["SHIPPED"],
  SHIPPED:          ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED:        [],
  CANCELLED:        [],
};

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingForm, setTrackingForm] = useState({ trackingNumber: "", trackingUrl: "" });

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      const json = await res.json();
      if (res.ok) {
        setOrder(json.data);
      } else {
        addToast("error", "Failed to load order");
      }
    } catch {
      addToast("error", "Network error");
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const updateStatus = async (newStatus: string) => {
    if (!confirm(`Update order status to ${newStatus}?`)) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        addToast("success", `Order updated to ${newStatus}`);
        fetchOrder();
      } else {
        addToast("error", "Failed to update status");
      }
    } catch {
      addToast("error", "Network error");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveTracking = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackingForm),
      });
      if (res.ok) {
        addToast("success", "Tracking info updated");
        setTrackingModalOpen(false);
        fetchOrder();
      } else {
        addToast("error", "Failed to update tracking");
      }
    } catch {
      addToast("error", "Network error");
    } finally {
      setUpdating(false);
    }
  };

  const openTrackingModal = () => {
    setTrackingForm({ trackingNumber: order.trackingNumber || "", trackingUrl: order.trackingUrl || "" });
    setTrackingModalOpen(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--color-gray-50)] flex">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto flex items-center justify-center">
        <p className="text-[var(--color-muted)]">Loading...</p>
      </main>
    </div>
  );

  if (!order) return null;

  const nextStatuses = VALID_TRANSITIONS[order.status] || [];
  const address = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress;

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] flex">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <Link href="/admin/orders" className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-brand-navy)] transition-colors">
            ← Back to Orders
          </Link>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[var(--color-brand-navy)]">Order #{order.id.slice(-8).toUpperCase()}</h2>
            <p className="text-sm text-[var(--color-muted)] mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}>
            {order.status}
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden">
              <div className="px-6 py-5 border-b border-[var(--color-border)]">
                <h3 className="text-lg font-bold text-[var(--color-brand-navy)]">Order Items</h3>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-[var(--color-gray-50)] border-b border-[var(--color-border)] text-[var(--color-muted)]">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Product</th>
                    <th className="px-6 py-3 font-semibold">Price</th>
                    <th className="px-6 py-3 font-semibold">Quantity</th>
                    <th className="px-6 py-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {order.items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-[var(--color-gray-50)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                            {item.product.images?.[0] && <img src={item.product.images[0]} alt="product" className="w-full h-full object-cover" />}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-brand-navy)]">{item.product.title}</p>
                            {item.variant && (
                              <p className="text-xs text-[var(--color-muted)]">{item.variant.variantType}: {item.variant.value}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><PriceTag price={item.unitPrice} size="sm" locale="en" /></td>
                      <td className="px-6 py-4">{item.quantity}</td>
                      <td className="px-6 py-4 font-bold"><PriceTag price={item.unitPrice * item.quantity} size="sm" locale="en" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="p-6 bg-[var(--color-gray-50)] flex flex-col gap-2 border-t border-[var(--color-border)] items-end text-sm">
                <div className="flex justify-between w-64">
                  <span className="text-[var(--color-muted)]">Subtotal:</span>
                  <span>{parseFloat(order.subtotal).toFixed(2)} SAR</span>
                </div>
                {parseFloat(order.discountAmount) > 0 && (
                  <div className="flex justify-between w-64 text-green-600">
                    <span>Discount:</span>
                    <span>-{parseFloat(order.discountAmount).toFixed(2)} SAR</span>
                  </div>
                )}
                <div className="flex justify-between w-64 text-base font-bold text-[var(--color-brand-navy)] mt-2 pt-2 border-t border-[var(--color-border)]">
                  <span>Total:</span>
                  <span>{parseFloat(order.total).toFixed(2)} SAR</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[var(--color-brand-navy)]">Update Status</h3>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {nextStatuses.length > 0 ? nextStatuses.map(ns => (
                  <button key={ns} disabled={updating} onClick={() => updateStatus(ns)}
                    className={`px-4 py-2 font-semibold rounded-lg transition-colors ${STATUS_COLORS[ns] ?? "bg-gray-100 text-gray-700"} hover:opacity-80 disabled:opacity-50`}>
                    Move to {ns}
                  </button>
                )) : (
                  <p className="text-sm text-[var(--color-muted)]">Order is in a final state and cannot be updated.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
              <h3 className="text-lg font-bold text-[var(--color-brand-navy)] mb-4">Customer Details</h3>
              <div className="space-y-4 text-sm">
                {order.user ? (
                  <>
                    <div>
                      <p className="text-[var(--color-muted)] text-xs font-semibold uppercase mb-1">Name</p>
                      <Link href={`/admin/customers/${order.user.id}` as Parameters<typeof Link>[0]["href"]} className="font-medium text-[var(--color-brand-gold)] hover:underline">
                        {order.user.name}
                      </Link>
                    </div>
                    <div>
                      <p className="text-[var(--color-muted)] text-xs font-semibold uppercase mb-1">Email</p>
                      <p>{order.user.email}</p>
                    </div>
                    {order.user.phone && (
                      <div>
                        <p className="text-[var(--color-muted)] text-xs font-semibold uppercase mb-1">Phone</p>
                        <p>{order.user.phone}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded mb-2">GUEST ORDER</span>
                    <div>
                      <p className="text-[var(--color-muted)] text-xs font-semibold uppercase mb-1">Email</p>
                      <p>{order.guestEmail}</p>
                    </div>
                    {order.guestPhone && (
                      <div>
                        <p className="text-[var(--color-muted)] text-xs font-semibold uppercase mb-1">Phone</p>
                        <p>{order.guestPhone}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
              <h3 className="text-lg font-bold text-[var(--color-brand-navy)] mb-4">Shipping Info</h3>
              <div className="text-sm">
                <p className="font-medium mb-1">{address.street}</p>
                <p className="text-[var(--color-muted)]">{address.city}, {address.postalCode || ""}</p>
                <p className="text-[var(--color-muted)]">{address.country}</p>
              </div>

              <hr className="my-4 border-[var(--color-border)]" />
              
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-[var(--color-brand-navy)]">Tracking</h4>
                <button onClick={openTrackingModal} className="text-xs font-medium text-[var(--color-brand-gold)] hover:underline">Edit</button>
              </div>
              
              {order.trackingNumber ? (
                <div className="text-sm">
                  <p className="text-[var(--color-muted)]">Number: <span className="font-mono text-foreground">{order.trackingNumber}</span></p>
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--color-brand-gold)] hover:underline break-all mt-1 block">
                      {order.trackingUrl}
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">No tracking info provided.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Tracking Modal */}
      <Modal open={trackingModalOpen} onClose={() => setTrackingModalOpen(false)} title="Update Tracking Info" size="sm">
        <div className="space-y-4">
          <Input 
            id="tracking-number" 
            label="Tracking Number" 
            value={trackingForm.trackingNumber} 
            onChange={e => setTrackingForm(f => ({ ...f, trackingNumber: e.target.value }))} 
            placeholder="e.g. 1Z9999999999999999" 
          />
          <Input 
            id="tracking-url" 
            label="Tracking URL" 
            value={trackingForm.trackingUrl} 
            onChange={e => setTrackingForm(f => ({ ...f, trackingUrl: e.target.value }))} 
            placeholder="https://tracker.provider.com/..." 
          />
        </div>
        <div className="flex gap-3 pt-4 border-t border-[var(--color-border)] mt-4">
          <Button variant="primary" fullWidth size="md" loading={updating} onClick={handleSaveTracking}>Save Tracking</Button>
          <Button variant="secondary" fullWidth size="md" onClick={() => setTrackingModalOpen(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
