"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal, useToast } from "@/components/ui/Modal";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface Order {
  id: string; status: string; total: number; createdAt: string;
  guestEmail?: string;
  user?: { name: string; email: string };
  _count: { items: number };
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}

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



export default function AdminOrdersPage() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingForm, setTrackingForm] = useState({ trackingNumber: "", trackingUrl: "" });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), pageSize: "20" });
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      const res = await fetch(`/api/admin/orders?${params}`);
      const json = await res.json();
      setOrders(json.data ?? []);
      setTotalPages(json.meta?.totalPages ?? 1);
      setTotal(json.meta?.total ?? 0);
    } finally { setLoading(false); }
  }, [page, filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (order: Order, newStatus: string) => {
    setUpdating(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message);
      addToast("success", `Order updated to ${newStatus}`);
      fetchOrders();
    } catch (e: any) { addToast("error", e.message ?? "Update failed"); }
    finally { setUpdating(null); }
  };

  const openTrackingModal = (order: Order) => {
    setTrackingOrder(order);
    setTrackingForm({ trackingNumber: order.trackingNumber || "", trackingUrl: order.trackingUrl || "" });
    setTrackingModalOpen(true);
  };

  const handleSaveTracking = async () => {
    if (!trackingOrder) return;
    setUpdating(trackingOrder.id);
    try {
      const res = await fetch(`/api/admin/orders/${trackingOrder.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackingForm),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message);
      addToast("success", "Tracking info updated");
      setTrackingModalOpen(false);
      fetchOrders();
    } catch (e: any) { addToast("error", e.message ?? "Update failed"); }
    finally { setUpdating(null); }
  };

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] flex">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)]">Orders</h2>
            <p className="text-sm text-[var(--color-muted)] mt-1">{total} total orders</p>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {["ALL", ...STATUSES].map(s => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors border ${filterStatus === s ? "bg-[var(--color-brand-navy)] text-white border-[var(--color-brand-navy)]" : "bg-white text-[var(--color-gray-600)] border-[var(--color-border)] hover:border-[var(--color-brand-navy)]/40"}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[var(--color-muted)]">Loading orders…</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center"><p className="text-3xl mb-3">📦</p><p className="text-[var(--color-muted)]">No orders found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-gray-50)]">
                    {["Order ID", "Customer", "Items", "Total", "Status", "Date", "Update Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const nextStatuses = VALID_TRANSITIONS[order.status] ?? [];
                    return (
                      <tr key={order.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-gray-50)] transition-colors">
                        <td className="px-4 py-4">
                          <p className="font-mono text-xs text-[var(--color-muted)]">#{order.id.slice(-8).toUpperCase()}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium">{order.user?.name ?? "Guest"}</p>
                          <p className="text-xs text-[var(--color-muted)]">{order.user?.email ?? order.guestEmail}</p>
                        </td>
                        <td className="px-4 py-4 text-[var(--color-muted)]">{order._count.items}</td>
                        <td className="px-4 py-4 font-semibold">{parseFloat(order.total.toString()).toFixed(2)} SAR</td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-[var(--color-muted)]">
                          {new Date(order.createdAt).toLocaleDateString("en-SA")}
                        </td>
                        <td className="px-4 py-4">
                          {nextStatuses.length > 0 ? (
                            <div className="flex gap-1.5 flex-wrap">
                              {nextStatuses.map(ns => (
                                <button key={ns} disabled={updating === order.id}
                                  onClick={() => updateStatus(order, ns)}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${STATUS_COLORS[ns] ?? "bg-gray-100 text-gray-700"} hover:opacity-80 disabled:opacity-50`}>
                                  → {ns}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--color-gray-300)]">Final state</span>
                          )}
                          <div className="mt-2">
                            <button 
                              onClick={() => openTrackingModal(order)}
                              className="text-xs font-medium text-[var(--color-brand-gold)] hover:underline"
                            >
                              Edit Tracking
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-[var(--color-gray-100)] transition-colors">← Prev</button>
            <span className="px-3 py-1.5 text-sm">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-[var(--color-gray-100)] transition-colors">Next →</button>
          </div>
        )}
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
          <Button variant="primary" fullWidth size="md" loading={updating === trackingOrder?.id} onClick={handleSaveTracking}>Save Tracking</Button>
          <Button variant="secondary" fullWidth size="md" onClick={() => setTrackingModalOpen(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
