"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Modal";
import { PriceTag } from "@/components/ui/Badge";

export default function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();
  
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/customers/${id}`);
    const json = await res.json();
    if (res.ok) setCustomer(json.data);
    else addToast("error", "Failed to load customer");
    setLoading(false);
  }, [id, addToast]);

  useEffect(() => { fetchCustomer(); }, [fetchCustomer]);

  const handleResetPassword = async () => {
    if (!confirm("Send a password reset email to this customer?")) return;
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: "POST" });
      if (res.ok) addToast("success", "Password reset email sent!");
      else addToast("error", "Failed to send email");
    } catch {
      addToast("error", "Network error");
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--color-gray-50)] flex">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto flex items-center justify-center">
        <p className="text-[var(--color-muted)]">Loading...</p>
      </main>
    </div>
  );

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] flex">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <Link href="/admin/customers" className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-brand-navy)] transition-colors">
            ← Back to Customers
          </Link>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[var(--color-brand-navy)]">{customer.name}</h2>
            <p className="text-sm text-[var(--color-muted)] mt-1">{customer.email} • Joined {new Date(customer.createdAt).toLocaleDateString()}</p>
          </div>
          <Button variant="secondary" loading={sendingEmail} onClick={handleResetPassword}>
            Send Password Reset
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Info Card */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
              <h3 className="text-lg font-bold text-[var(--color-brand-navy)] mb-4">Contact Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="block text-[var(--color-muted)] text-xs font-semibold uppercase tracking-wider mb-1">Email</span>
                  <span className="text-[var(--color-foreground)]">{customer.email}</span>
                </div>
                <div>
                  <span className="block text-[var(--color-muted)] text-xs font-semibold uppercase tracking-wider mb-1">Phone</span>
                  <span className="text-[var(--color-foreground)]">{customer.phone || "—"}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
              <h3 className="text-lg font-bold text-[var(--color-brand-navy)] mb-4">Saved Addresses</h3>
              {customer.addresses?.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">No addresses saved</p>
              ) : (
                <ul className="space-y-4">
                  {customer.addresses?.map((addr: any) => (
                    <li key={addr.id} className="text-sm border-l-2 border-[var(--color-brand-gold)] pl-3">
                      <span className="block font-semibold mb-0.5">{addr.street}</span>
                      <span className="block text-[var(--color-muted)]">{addr.city}, {addr.state} {addr.zip}</span>
                      <span className="block text-[var(--color-muted)]">{addr.country}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden">
              <div className="px-6 py-5 border-b border-[var(--color-border)]">
                <h3 className="text-lg font-bold text-[var(--color-brand-navy)]">Order History</h3>
              </div>
              {customer.orders?.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[var(--color-muted)]">No orders placed yet.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-[var(--color-gray-50)] border-b border-[var(--color-border)] text-[var(--color-muted)] font-semibold">
                      <th className="px-6 py-3">Order ID</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Items</th>
                      <th className="px-6 py-3">Total</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {customer.orders?.map((o: any) => {
                      const itemCount = o.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
                      return (
                        <tr key={o.id} className="hover:bg-[var(--color-gray-50)] transition-colors">
                          <td className="px-6 py-4 font-mono text-[var(--color-brand-navy)]">#{o.id.slice(-8).toUpperCase()}</td>
                          <td className="px-6 py-4 text-[var(--color-muted)]">{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-[var(--color-muted)]">{itemCount}</td>
                          <td className="px-6 py-4 font-medium"><PriceTag price={o.total} size="sm" locale="en" /></td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                              {o.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Link href={`/admin/orders/${o.id}`} className="text-[var(--color-brand-gold)] font-medium hover:underline">
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
