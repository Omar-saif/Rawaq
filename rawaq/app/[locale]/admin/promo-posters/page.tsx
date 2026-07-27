"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "@/lib/i18n/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal, useToast } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";

interface PromoPoster {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

const EMPTY_FORM = {
  imageUrl: "", linkUrl: "",
  sortOrder: 0, isActive: true, startsAt: "", endsAt: "",
};

export default function AdminPromoPostersPage() {
  const { addToast } = useToast();
  const [posters, setPosters] = useState<PromoPoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PromoPoster | null>(null);
  const [editing, setEditing] = useState<PromoPoster | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const fetchPosters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promo-posters");
      const json = await res.json();
      setPosters(json.data ?? []);
    } catch {
      addToast("error", "Failed to load promo posters");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchPosters(); }, [fetchPosters]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sortOrder: posters.length });
    setImagePreview("");
    setFormOpen(true);
  };

  const openEdit = (poster: PromoPoster) => {
    setEditing(poster);
    setForm({
      imageUrl: poster.imageUrl,
      linkUrl: poster.linkUrl ?? "",
      sortOrder: poster.sortOrder, isActive: poster.isActive,
      startsAt: poster.startsAt ? poster.startsAt.slice(0, 16) : "",
      endsAt: poster.endsAt ? poster.endsAt.slice(0, 16) : "",
    });
    setImagePreview(poster.imageUrl);
    setFormOpen(true);
  };

  const handleField = (field: string, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "imageUrl") setImagePreview(value as string);
  };

  const handleSave = async () => {
    if (!form.imageUrl) {
      addToast("warning", "Image URL is required");
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
      const url = editing ? `/api/admin/promo-posters/${editing.id}` : "/api/admin/promo-posters";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message);
      addToast("success", editing ? "Promo Poster updated!" : "Promo Poster created!");
      setFormOpen(false);
      fetchPosters();
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
      const res = await fetch(`/api/admin/promo-posters/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      addToast("success", "Promo Poster deleted");
      setDeleteTarget(null);
      fetchPosters();
    } catch {
      addToast("error", "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (poster: PromoPoster) => {
    try {
      await fetch(`/api/admin/promo-posters/${poster.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !poster.isActive }),
      });
      setPosters((prev) => prev.map((s) => s.id === poster.id ? { ...s, isActive: !s.isActive } : s));
    } catch {
      addToast("error", "Toggle failed");
    }
  };

  const handleDragStart = (index: number) => { dragItem.current = index; };
  const handleDragEnter = (index: number) => { dragOverItem.current = index; };
  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const reordered = [...posters];
    const dragged = reordered.splice(dragItem.current, 1)[0];
    reordered.splice(dragOverItem.current, 0, dragged);

    const updated = reordered.map((s, i) => ({ ...s, sortOrder: i }));
    setPosters(updated);
    dragItem.current = null;
    dragOverItem.current = null;

    try {
      await fetch("/api/admin/promo-posters/reorder", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updated.map((s) => ({ id: s.id, sortOrder: s.sortOrder })) }),
      });
    } catch {
      addToast("error", "Reorder save failed");
      fetchPosters();
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
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.href === "/admin/promo-posters" ? "bg-[var(--color-brand-gold)] text-[var(--color-brand-navy)] font-bold shadow-md" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-10 px-8 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[var(--color-brand-navy)]">Promo Posters</h2>
          <Button onClick={openCreate} className="gap-2"><span>+</span> Add Poster</Button>
        </header>

        <div className="p-8">
          {loading ? (
            <p className="text-center py-20 text-[var(--color-muted)] animate-pulse">Loading posters...</p>
          ) : posters.length === 0 ? (
            <div className="bg-white rounded-[var(--radius-xl)] p-12 text-center border border-[var(--color-border)]">
              <span className="text-4xl mb-4 block">🖼️</span>
              <h3 className="text-xl font-bold text-[var(--color-brand-navy)] mb-2">No posters found</h3>
              <p className="text-[var(--color-muted)] mb-6">Create your first promotional poster.</p>
              <Button onClick={openCreate}>Add Poster</Button>
            </div>
          ) : (
            <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-[var(--color-gray-50)] border-b border-[var(--color-border)] text-sm">
                  <tr>
                    <th className="px-6 py-4 w-12 text-[var(--color-muted)] font-medium">☰</th>
                    <th className="px-6 py-4 text-[var(--color-muted)] font-medium">Image</th>
                    <th className="px-6 py-4 text-[var(--color-muted)] font-medium">Link</th>
                    <th className="px-6 py-4 text-[var(--color-muted)] font-medium">Status</th>
                    <th className="px-6 py-4 text-[var(--color-muted)] font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {posters.map((poster, idx) => (
                    <tr
                      key={poster.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragEnter={() => handleDragEnter(idx)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      className="hover:bg-[var(--color-gray-50)] transition-colors group bg-white cursor-move"
                    >
                      <td className="px-6 py-4 text-[var(--color-muted)]">⋮⋮</td>
                      <td className="px-6 py-4">
                        <div className="relative w-16 h-24 rounded-md overflow-hidden bg-[var(--color-gray-100)] border border-[var(--color-border)]">
                          <Image src={poster.imageUrl} alt="Poster" fill className="object-cover" unoptimized />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-[var(--color-brand-navy)]">
                          {poster.linkUrl || <span className="text-[var(--color-muted)] font-normal italic">No link</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleActive(poster)} className="hover:opacity-80 transition-opacity">
                          <Badge variant={poster.isActive ? "success" : "gray"}>{poster.isActive ? "Active" : "Hidden"}</Badge>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(poster)}>Edit</Button>
                        <Button variant="secondary" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteTarget(poster)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Poster" : "Add Poster"}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--color-brand-navy)] mb-2">Image URL *</label>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <Input value={form.imageUrl} onChange={(e) => handleField("imageUrl", e.target.value)} placeholder="https://..." />
                  <p className="text-xs text-[var(--color-muted)] mt-1">Portrait aspect ratio recommended (e.g. 4:5)</p>
                </div>
                {imagePreview && (
                  <div className="relative w-20 h-24 rounded-lg overflow-hidden border border-[var(--color-border)] shrink-0 bg-[var(--color-gray-100)]">
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--color-brand-navy)] mb-2">Link URL</label>
              <Input value={form.linkUrl} onChange={(e) => handleField("linkUrl", e.target.value)} placeholder="/category/..." />
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
              <label htmlFor="isActive" className="text-sm font-medium text-[var(--color-brand-navy)] cursor-pointer">Active (Show to customers)</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Poster"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Poster">
        <p className="mb-6 text-[var(--color-gray-600)]">Are you sure you want to delete this promotional poster? This action cannot be undone.</p>
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
