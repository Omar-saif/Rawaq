"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal, useToast } from "@/components/ui/Modal";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface Coupon {
  id: string; code: string; discountType: string; discountValue: number;
  minCartValue?: number; usageLimit: number; timesUsed: number;
  isActive: boolean; expiresAt?: string;
}



const EMPTY = {
  code: "", discountType: "PERCENTAGE", discountValue: "10",
  minCartValue: "", usageLimit: "100", isActive: true, expiresAt: "",
};

export default function AdminCouponsPage() {
  const { addToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/coupons?pageSize=100");
    const json = await res.json();
    setCoupons(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const setField = (f: string, v: string | boolean) => setForm(p => ({ ...p, [f]: v }));

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY }); setFormOpen(true); };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code, discountType: c.discountType,
      discountValue: c.discountValue.toString(),
      minCartValue: c.minCartValue?.toString() ?? "",
      usageLimit: c.usageLimit?.toString() ?? "100",
      isActive: c.isActive,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 16) : "",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discountValue) { addToast("warning", "Code and discount value are required"); return; }
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minCartValue: form.minCartValue ? parseFloat(form.minCartValue) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : 100,
        isActive: form.isActive,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };
      const url = editing ? `/api/admin/coupons/${editing.id}` : "/api/admin/coupons";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error?.message);
      addToast("success", editing ? "Coupon updated!" : "Coupon created!");
      setFormOpen(false); fetchCoupons();
    } catch (e: any) { addToast("error", e.message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/coupons/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) { addToast("success", "Coupon deleted"); setDeleteTarget(null); fetchCoupons(); }
    else addToast("error", "Delete failed");
  };

  const toggleActive = async (c: Coupon) => {
    await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: c.code, discountType: c.discountType,
        discountValue: parseFloat(c.discountValue.toString()),
        isActive: !c.isActive,
        usageLimit: c.usageLimit,
      }),
    });
    setCoupons(prev => prev.map(cp => cp.id === c.id ? { ...cp, isActive: !cp.isActive } : cp));
  };

  const isExpired = (c: Coupon) => c.expiresAt ? new Date(c.expiresAt) < new Date() : false;

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] flex">
      <AdminSidebar />

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)]">Coupons</h2>
            <p className="text-sm text-[var(--color-muted)] mt-1">{coupons.length} coupons</p>
          </div>
          <Button variant="primary" onClick={openCreate}>+ Create Coupon</Button>
        </div>

        <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[var(--color-muted)]">Loading…</div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-3xl mb-3">🏷️</p>
              <p className="text-[var(--color-gray-700)] font-semibold mb-4">No coupons yet</p>
              <Button variant="primary" onClick={openCreate}>Create First Coupon</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-gray-50)]">
                    {["Code", "Discount", "Min Cart", "Uses / Limit", "Expires", "Status", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-gray-50)] transition-colors">
                      <td className="px-4 py-4">
                        <span className="font-mono font-bold text-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/10 px-2.5 py-1 rounded-lg">{c.code}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.discountType === "PERCENTAGE" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}>
                          {c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `${c.discountValue} SAR`} OFF
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[var(--color-muted)]">{c.minCartValue ? `${c.minCartValue} SAR` : "—"}</td>
                      <td className="px-4 py-4">
                        <span className="text-sm">{c.timesUsed}</span>
                        <span className="text-[var(--color-muted)]">/{c.usageLimit}</span>
                      </td>
                      <td className="px-4 py-4 text-xs">
                        {c.expiresAt ? (
                          <span className={isExpired(c) ? "text-red-500 font-semibold" : "text-[var(--color-muted)]"}>
                            {isExpired(c) ? "⚠ Expired · " : ""}{new Date(c.expiresAt).toLocaleDateString()}
                          </span>
                        ) : <span className="text-[var(--color-gray-300)]">Never</span>}
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => toggleActive(c)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${c.isActive ? "bg-[var(--color-brand-navy)]" : "bg-[var(--color-gray-200)]"}`}>
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${c.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(c)} className="px-2.5 py-1 text-xs font-medium text-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/10 rounded-lg hover:bg-[var(--color-brand-navy)]/20 transition-colors">Edit</button>
                          <button onClick={() => setDeleteTarget(c)} className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Form modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Coupon" : "Create Coupon"} size="lg">
        <div className="space-y-4">
          <Input id="coupon-code" label="Coupon Code *" value={form.code} onChange={e => setField("code", e.target.value.toUpperCase())} required placeholder="SUMMER25" hint="Auto-uppercased" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="coupon-type" className="block text-sm font-medium text-[var(--color-gray-700)] mb-1.5">Discount Type *</label>
              <select id="coupon-type" value={form.discountType} onChange={e => setField("discountType", e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-[var(--radius-lg)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)]">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (SAR)</option>
              </select>
            </div>
            <Input id="coupon-value" label={`Discount Value * (${form.discountType === "PERCENTAGE" ? "%" : "SAR"})`} type="number" value={form.discountValue} onChange={e => setField("discountValue", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="coupon-min" label="Minimum Cart Value (SAR)" type="number" value={form.minCartValue} onChange={e => setField("minCartValue", e.target.value)} placeholder="100" />
            <Input id="coupon-limit" label="Usage Limit (max times usable)" type="number" value={form.usageLimit} onChange={e => setField("usageLimit", e.target.value)} placeholder="100" />
          </div>
          <Input id="coupon-expires" label="Expiry Date & Time (optional)" type="datetime-local" value={form.expiresAt} onChange={e => setField("expiresAt", e.target.value)} />
          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => setField("isActive", !form.isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-[var(--color-brand-navy)]" : "bg-[var(--color-gray-200)]"}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm font-medium">{form.isActive ? "Active" : "Inactive"}</span>
          </label>
        </div>
        <div className="flex gap-3 pt-4 border-t border-[var(--color-border)] mt-4">
          <Button variant="primary" fullWidth size="lg" loading={saving} onClick={handleSave}>{editing ? "Save Changes" : "Create Coupon"}</Button>
          <Button variant="secondary" fullWidth size="lg" onClick={() => setFormOpen(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Coupon" size="sm">
        <p className="text-sm text-[var(--color-gray-600)] mb-4">
          Delete coupon <strong className="font-mono">{deleteTarget?.code}</strong>? Existing orders using it are unaffected.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" fullWidth onClick={handleDelete}>Delete</Button>
          <Button variant="secondary" fullWidth onClick={() => setDeleteTarget(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
