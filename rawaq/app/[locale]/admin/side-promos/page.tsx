"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Link } from "@/lib/i18n/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal, useToast } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";

interface SidePromo {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  targetPages: string[];
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

const EMPTY_FORM = {
  imageUrl: "", linkUrl: "", targetPages: [] as string[],
  isActive: true, startsAt: "", endsAt: "",
};

const PAGE_OPTIONS = [
  { value: "category", label: "Category Page" },
  { value: "product", label: "Product Page" },
  { value: "cart", label: "Cart Page" },
];

export default function AdminSidePromosPage() {
  const { addToast } = useToast();
  const [promos, setPromos] = useState<SidePromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SidePromo | null>(null);
  const [editing, setEditing] = useState<SidePromo | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/side-promos");
      const json = await res.json();
      setPromos(json.data ?? []);
    } catch {
      addToast("error", "Failed to load side promos");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImagePreview("");
    setFormOpen(true);
  };

  const openEdit = (promo: SidePromo) => {
    setEditing(promo);
    setForm({
      imageUrl: promo.imageUrl,
      linkUrl: promo.linkUrl ?? "",
      targetPages: promo.targetPages,
      isActive: promo.isActive,
      startsAt: promo.startsAt ? promo.startsAt.slice(0, 16) : "",
      endsAt: promo.endsAt ? promo.endsAt.slice(0, 16) : "",
    });
    setImagePreview(promo.imageUrl);
    setFormOpen(true);
  };

  const handleField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "imageUrl") setImagePreview(value as string);
  };

  const togglePage = (page: string) => {
    setForm((prev) => {
      const exists = prev.targetPages.includes(page);
      if (exists) return { ...prev, targetPages: prev.targetPages.filter((p) => p !== page) };
      return { ...prev, targetPages: [...prev.targetPages, page] };
    });
  };

  const handleSave = async () => {
    if (!form.imageUrl || form.targetPages.length === 0) {
      addToast("warning", "Image URL and at least one target page are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        linkUrl: form.linkUrl || null,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      };
      const url = editing ? `/api/admin/side-promos/${editing.id}` : "/api/admin/side-promos";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message);
      addToast("success", editing ? "Side promo updated!" : "Side promo created!");
      setFormOpen(false);
      fetchPromos();
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
      const res = await fetch(`/api/admin/side-promos/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      addToast("success", "Side promo deleted");
      setDeleteTarget(null);
      fetchPromos();
    } catch {
      addToast("error", "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (promo: SidePromo) => {
    try {
      await fetch(`/api/admin/side-promos/${promo.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      setPromos((prev) => prev.map((s) => s.id === promo.id ? { ...s, isActive: !s.isActive } : s));
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
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.href === "/admin/side-promos" ? "bg-[var(--color-brand-gold)] text-[var(--color-brand-navy)] font-bold shadow-md" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-10 px-8 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[var(--color-brand-navy)]">Side Promos</h2>
          <Button onClick={openCreate} className="gap-2"><span>+</span> Add Promo</Button>
        </header>

        <div className="p-8">
          {loading ? (
            <p className="text-center py-20 text-[var(--color-muted)] animate-pulse">Loading side promos...</p>
          ) : promos.length === 0 ? (
            <div className="bg-white rounded-[var(--radius-xl)] p-12 text-center border border-[var(--color-border)]">
              <span className="text-4xl mb-4 block">📢</span>
              <h3 className="text-xl font-bold text-[var(--color-brand-navy)] mb-2">No side promos found</h3>
              <p className="text-[var(--color-muted)] mb-6">Create a vertical promotion banner.</p>
              <Button onClick={openCreate}>Add Promo</Button>
            </div>
          ) : (
            <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-[var(--color-gray-50)] border-b border-[var(--color-border)] text-sm">
                  <tr>
                    <th className="px-6 py-4 text-[var(--color-muted)] font-medium">Image</th>
                    <th className="px-6 py-4 text-[var(--color-muted)] font-medium">Pages</th>
                    <th className="px-6 py-4 text-[var(--color-muted)] font-medium">Link</th>
                    <th className="px-6 py-4 text-[var(--color-muted)] font-medium">Status</th>
                    <th className="px-6 py-4 text-[var(--color-muted)] font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {promos.map((promo) => (
                    <tr key={promo.id} className="hover:bg-[var(--color-gray-50)] transition-colors bg-white">
                      <td className="px-6 py-4">
                        <div className="relative w-12 h-20 rounded-md overflow-hidden bg-[var(--color-gray-100)] border border-[var(--color-border)]">
                          <Image src={promo.imageUrl} alt="Promo" fill className="object-cover" unoptimized />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {promo.targetPages.map(tp => (
                            <Badge key={tp} variant="default" className="text-xs bg-[var(--color-brand-navy)] text-white">{tp}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-[var(--color-brand-navy)]">
                          {promo.linkUrl || <span className="text-[var(--color-muted)] font-normal italic">No link</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleActive(promo)} className="hover:opacity-80 transition-opacity">
                          <Badge variant={promo.isActive ? "success" : "default"}>{promo.isActive ? "Active" : "Hidden"}</Badge>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(promo)}>Edit</Button>
                        <Button variant="secondary" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteTarget(promo)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Side Promo" : "Add Side Promo"}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--color-brand-navy)] mb-2">Image URL *</label>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <Input value={form.imageUrl} onChange={(e) => handleField("imageUrl", e.target.value)} placeholder="https://..." />
                  <p className="text-xs text-[var(--color-muted)] mt-1">Vertical banner format recommended.</p>
                </div>
                {imagePreview && (
                  <div className="relative w-12 h-20 rounded-lg overflow-hidden border border-[var(--color-border)] shrink-0 bg-[var(--color-gray-100)]">
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--color-brand-navy)] mb-2">Link URL</label>
              <Input value={form.linkUrl} onChange={(e) => handleField("linkUrl", e.target.value)} placeholder="/category/..." />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--color-brand-navy)] mb-2">Target Pages *</label>
              <div className="flex gap-3">
                {PAGE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 border border-[var(--color-border)] p-2 rounded-lg cursor-pointer hover:bg-[var(--color-gray-50)]">
                    <input type="checkbox" checked={form.targetPages.includes(opt.value)} onChange={() => togglePage(opt.value)} className="w-4 h-4 accent-[var(--color-brand-navy)]" />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-brand-navy)] mb-2">Starts At (Optional)</label>
              <Input type="datetime-local" value={form.startsAt} onChange={(e) => handleField("startsAt", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-brand-navy)] mb-2">Ends At (Optional)</label>
              <Input type="datetime-local" value={form.endsAt} onChange={(e) => handleField("endsAt", e.target.value)} />
            </div>

            <div className="md:col-span-2 flex items-center gap-3 bg-[var(--color-gray-50)] p-4 rounded-xl border border-[var(--color-border)]">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => handleField("isActive", e.target.checked)} className="w-5 h-5 accent-[var(--color-brand-navy)] rounded cursor-pointer" />
              <label htmlFor="isActive" className="text-sm font-medium text-[var(--color-brand-navy)] cursor-pointer">Active</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Promo"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Promo">
        <p className="mb-6 text-[var(--color-gray-600)]">Are you sure you want to delete this side promo banner? This action cannot be undone.</p>
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
