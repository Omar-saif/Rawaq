"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@/lib/i18n/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/customers?pageSize=100");
    const json = await res.json();
    setCustomers(json.data?.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] flex">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)]">Customers</h2>
            <p className="text-sm text-[var(--color-muted)] mt-1">{customers.length} registered users</p>
          </div>
        </div>

        <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[var(--color-muted)]">Loading…</div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-3xl mb-3">👥</p>
              <p className="text-[var(--color-gray-700)] font-semibold mb-4">No customers yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-gray-50)]">
                    <th className="px-6 py-4 font-semibold text-[var(--color-muted)]">Name</th>
                    <th className="px-6 py-4 font-semibold text-[var(--color-muted)]">Email</th>
                    <th className="px-6 py-4 font-semibold text-[var(--color-muted)]">Joined</th>
                    <th className="px-6 py-4 font-semibold text-[var(--color-muted)]">Orders</th>
                    <th className="px-6 py-4 font-semibold text-[var(--color-muted)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-[var(--color-gray-50)] transition-colors">
                      <td className="px-6 py-4 font-medium text-[var(--color-foreground)]">{c.name}</td>
                      <td className="px-6 py-4 text-[var(--color-muted)]">{c.email}</td>
                      <td className="px-6 py-4 text-[var(--color-muted)]">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)]">
                          {c.orderCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/customers/${c.id}`}
                          className="text-sm font-medium text-[var(--color-brand-gold)] hover:text-[var(--color-brand-navy)] transition-colors"
                        >
                          View Profile →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
