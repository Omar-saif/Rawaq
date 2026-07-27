"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Link } from "@/lib/i18n/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal, useToast } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";

interface DeliveryVendor {
  id: string;
  name: string;
  nameAr: string;
  logoUrl: string | null;
  description: string | null;
  descriptionAr: string | null;
  estimatedDays: string;
  estimatedDaysAr: string;
  price: string; // Decimal from Prisma comes as string in JSON
  isActive: boolean;
}

const EMPTY_FORM = {
  name: "", nameAr: "", logoUrl: "", description: "", descriptionAr: "",
  estimatedDays: "", estimatedDaysAr: "", price: "0", isActive: true,
};

export default function AdminDeliveryVendorsPage() {
  const { addToast } = useToast();
  const [vendors, setVendors] = useState<DeliveryVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryVendor | null>(null);
  const [editing, setEditing] = useState<DeliveryVendor | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/delivery-vendors");
      const json = await res.json();
      setVendors(json.data ?? []);
    } catch {
      addToast("error", "Failed to load delivery vendors");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImagePreview("");
    setFormOpen(true);
  };

  const openEdit = (vendor: DeliveryVendor) => {
    setEditing(vendor);
    setForm({
      name: vendor.name, nameAr: vendor.nameAr,
      logoUrl: vendor.logoUrl ?? "",
      description: vendor.description ?? "", descriptionAr: vendor.descriptionAr ?? "",
      estimatedDays: vendor.estimatedDays, estimatedDaysAr: vendor.estimatedDaysAr,
      price: vendor.price, isActive: vendor.isActive,
    });
    setImagePreview(vendor.logoUrl ?? "");
    setFormOpen(true);
  };

  const handleField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "logoUrl") setImagePreview(value as string);
  };

  const handleSave = async () => {
    if (!form.name || !form.estimatedDays || form.price === "") {
      addToast("warning", "Name, Estimated Days, and Price are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        logoUrl: form.logoUrl || null,
        description: form.description || null,
        descriptionAr: form.descriptionAr || null,
        price: parseFloat(form.price),
      };
      const url = editing ? `/api/admin/delivery-vendors/${editing.id}` : "/api/admin/delivery-vendors";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message);
      addToast("success", editing ? "Vendor updated!" : "Vendor created!");
      setFormOpen(false);
      fetchVendors();
    } catch (err: any) {
      addToast("error", err.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/delivery-vendors/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      addToast("success", "Vendor deleted");
      setDeleteTarget(null);
      fetchVendors();
    } catch {
      addToast("error", "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (vendor: DeliveryVendor) => {
    try {
      await fetch(`/api/admin/delivery-vendors/${vendor.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !vendor.isActive }),
      });
      setVendors((prev) => prev.map((s) => s.id === vendor.id ? { ...s, isActive: !s.isActive } : s));
    } catch {
      addToast("error", "Toggle failed");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] flex">
      <aside className="w-64 bg-[var(--color-brand-navy)] text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-gold)] mb-1">RAWAQ</p>
          <h1 className="text-lg font-bold">Admin Panel</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: "/admin",            label: "Dashboard",  icon: "📊" },
            { href: "/admin/products",   label: "Products",   icon: "🛍️" },
            { href: "/admin/categories", label: "Categories", icon: "📂" },
            { href: "/admin/orders",     label: "Orders",     icon: "📦" },
            { href: "/admin/coupons",    label: "Coupons",    icon: "🏷️" },
            { href: "/admin/slides",     label: "Hero Slides",icon: "🎞️" },
            { href: "/admin/promo-posters", label: "Promo Posters", icon: "🖼️" },
            { href: "/admin/delivery-vendors", label: "Delivery", icon: "🚚" },
            { href: "/admin/side-promos", label: "Side Promos", icon: "📢" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.href === "/admin/delivery-vendors" ? "bg-[var(--color-brand-gold)] text-[var(--color-brand-navy)] font-bold shadow-md" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-10 px-8 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[var(--color-brand-navy)]">Delivery Vendors</h2>
          <Button onClick={openCreate} className="gap-2"><span>+</span> Add Vendor</Button>
        </header>

        <div className="p-8">
          {loading ? (
            <p className="text-center py-20 text-[var(--color-muted)] animate-pulse">Loading vendors...</p>
          ) : vendors.length === 0 ? (
            <div className="bg-white rounded-[var(--radius-xl)] p-12 text-center border border-[var(--color-border)]">
              <span className="text-4xl mb-4 block">🚚</span>
              <h3 className="text-xl font-bold text-[var(--color-brand-navy)] mb-2">No delivery vendors</h3>
              <p className="text-[var(--color-muted)] mb-6">Create a shipping option for customers to select.</p>
              <Button onClick={openCreate}>Add Vendor</Button>
            </div>
          ) : (
            <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-[var(--color-gray-50)] border-b border-[var(--color-border)] text-sm">
                  <tr>
                    <th className="px-6 py-4 text-[var(--color-muted)] font-medium">Logo</th>
                    <th className="px-6 py-4 text-[var(--color-muted)] font-medium">Name</th>
                    <th className="px-6 py-4 text-[var(--color-muted)] font-medium">Price</th>
                    <th className="px-6 py-4 text-[var(--color-muted)] font-medium">Est. Delivery</th>
                    <th className="px-6 py-4 text-[var(--color-muted)] font-medium">Status</th>
                    <th className="px-6 py-4 text-[var(--color-muted)] font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-[var(--color-gray-50)] transition-colors bg-white">
                      <td className="px-6 py-4">
                        {vendor.logoUrl ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white border border-[var(--color-border)]">
                            <Image src={vendor.logoUrl} alt={vendor.name} fill className="object-contain p-1" unoptimized />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[var(--color-gray-100)] flex items-center justify-center text-sm font-bold text-[var(--color-gray-400)]">
                            {vendor.name.charAt(0)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-[var(--color-brand-navy)]">{vendor.name}</p>
                        {vendor.description && <p className="text-xs text-[var(--color-muted)] max-w-xs truncate">{vendor.description}</p>}
                      </td>
                      <td className="px-6 py-4 font-medium text-[var(--color-brand-navy)]">
                        {parseFloat(vendor.price) === 0 ? "Free" : `${parseFloat(vendor.price).toFixed(2)} SAR`}
                      </td>
                      <td className="px-6 py-4 text-sm">{vendor.estimatedDays}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleActive(vendor)} className="hover:opacity-80 transition-opacity">
                          <Badge variant={vendor.isActive ? "success" : "gray"}>{vendor.isActive ? "Active" : "Inactive"}</Badge>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(vendor)}>Edit</Button>
                        <Button variant="secondary" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteTarget(vendor)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Vendor" : "Add Vendor"}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--color-brand-navy)] mb-2">Name (EN) *</label>
              <Input value={form.name} onChange={(e) => handleField("name", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-brand-navy)] mb-2">Name (AR)</label>
              <Input value={form.nameAr} onChange={(e) => handleField("nameAr", e.target.value)} dir="rtl" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-brand-navy)] mb-2">Estimated Days (EN) *</label>
              <Input value={form.estimatedDays} onChange={(e) => handleField("estimatedDays", e.target.value)} placeholder="2-3 Business Days" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-brand-navy)] mb-2">Estimated Days (AR)</label>
              <Input value={form.estimatedDaysAr} onChange={(e) => handleField("estimatedDaysAr", e.target.value)} placeholder="٢-٣ أيام عمل" dir="rtl" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--color-brand-navy)] mb-2">Price (SAR) *</label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => handleField("price", e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--color-brand-navy)] mb-2">Logo URL</label>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <Input value={form.logoUrl} onChange={(e) => handleField("logoUrl", e.target.value)} placeholder="https://..." />
                </div>
                {imagePreview && (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[var(--color-border)] shrink-0 bg-white">
                    <Image src={imagePreview} alt="Preview" fill className="object-contain p-1" unoptimized />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-brand-navy)] mb-2">Description (EN)</label>
              <Textarea value={form.description} onChange={(e) => handleField("description", e.target.value)} rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-brand-navy)] mb-2">Description (AR)</label>
              <Textarea value={form.descriptionAr} onChange={(e) => handleField("descriptionAr", e.target.value)} rows={2} dir="rtl" />
            </div>

            <div className="md:col-span-2 flex items-center gap-3 bg-[var(--color-gray-50)] p-4 rounded-xl border border-[var(--color-border)]">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => handleField("isActive", e.target.checked)} className="w-5 h-5 accent-[var(--color-brand-navy)] rounded cursor-pointer" />
              <label htmlFor="isActive" className="text-sm font-medium text-[var(--color-brand-navy)] cursor-pointer">Active</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Vendor"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Vendor">
        <p className="mb-6 text-[var(--color-gray-600)]">Are you sure you want to delete this delivery vendor? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 border-red-600 text-white">
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
