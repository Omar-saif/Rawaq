"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "@/lib/i18n/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal, useToast } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";

interface Slide {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string | null;
  subtitleAr: string | null;
  imageUrl: string;
  ctaLabel: string | null;
  ctaLabelAr: string | null;
  ctaLink: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

const EMPTY_FORM = {
  title: "", titleAr: "", subtitle: "", subtitleAr: "",
  imageUrl: "", ctaLabel: "", ctaLabelAr: "", ctaLink: "",
  sortOrder: 0, isActive: true, startsAt: "", endsAt: "",
};

export default function AdminSlidesPage() {
  const { addToast } = useToast();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Slide | null>(null);
  const [editing, setEditing] = useState<Slide | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  // Drag-to-reorder state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const fetchSlides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/slides?pageSize=100");
      const json = await res.json();
      setSlides(json.data ?? []);
    } catch {
      addToast("error", "Failed to load slides");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchSlides(); }, [fetchSlides]);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sortOrder: slides.length });
    setImagePreview("");
    setFormOpen(true);
  };

  const openEdit = (slide: Slide) => {
    setEditing(slide);
    setForm({
      title: slide.title, titleAr: slide.titleAr,
      subtitle: slide.subtitle ?? "", subtitleAr: slide.subtitleAr ?? "",
      imageUrl: slide.imageUrl,
      ctaLabel: slide.ctaLabel ?? "", ctaLabelAr: slide.ctaLabelAr ?? "",
      ctaLink: slide.ctaLink ?? "",
      sortOrder: slide.sortOrder, isActive: slide.isActive,
      startsAt: slide.startsAt ? slide.startsAt.slice(0, 16) : "",
      endsAt: slide.endsAt ? slide.endsAt.slice(0, 16) : "",
    });
    setImagePreview(slide.imageUrl);
    setFormOpen(true);
  };

  const handleField = (field: string, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "imageUrl") setImagePreview(value as string);
  };

  const handleSave = async () => {
    if (!form.title || !form.imageUrl) {
      addToast("warning", "Title and Image URL are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        subtitle: form.subtitle || null,
        subtitleAr: form.subtitleAr || null,
        ctaLabel: form.ctaLabel || null,
        ctaLabelAr: form.ctaLabelAr || null,
        ctaLink: form.ctaLink || null,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      };
      const url = editing ? `/api/admin/slides/${editing.id}` : "/api/admin/slides";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message);
      addToast("success", editing ? "Slide updated!" : "Slide created!");
      setFormOpen(false);
      fetchSlides();
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
      const res = await fetch(`/api/admin/slides/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      addToast("success", "Slide deleted");
      setDeleteTarget(null);
      fetchSlides();
    } catch {
      addToast("error", "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (slide: Slide) => {
    try {
      await fetch(`/api/admin/slides/${slide.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !slide.isActive }),
      });
      setSlides((prev) => prev.map((s) => s.id === slide.id ? { ...s, isActive: !s.isActive } : s));
    } catch {
      addToast("error", "Toggle failed");
    }
  };

  // ── Drag-to-reorder ───────────────────────────────────────────────────────
  const handleDragStart = (index: number) => { dragItem.current = index; };
  const handleDragEnter = (index: number) => { dragOverItem.current = index; };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const reordered = [...slides];
    const dragged = reordered.splice(dragItem.current, 1)[0];
    reordered.splice(dragOverItem.current, 0, dragged);

    const updated = reordered.map((s, i) => ({ ...s, sortOrder: i }));
    setSlides(updated);
    dragItem.current = null;
    dragOverItem.current = null;

    try {
      await fetch("/api/admin/slides/reorder", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updated.map((s) => ({ id: s.id, sortOrder: s.sortOrder })) }),
      });
    } catch {
      addToast("error", "Reorder save failed");
      fetchSlides();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] flex">
      {/* Sidebar */}
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
            { href: "/account",          label: "My Account", icon: "👤" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href as Parameters<typeof Link>[0]["href"]}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                item.href === "/admin/slides"
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)]">Hero Slides</h2>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              Drag rows to reorder. Changes save instantly.
            </p>
          </div>
          <Button variant="primary" onClick={openCreate} leftIcon={<span>+</span>}>
            Add Slide
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[var(--color-muted)]">Loading slides…</div>
          ) : slides.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">🎞️</p>
              <p className="text-lg font-semibold text-[var(--color-gray-700)]">No slides yet</p>
              <p className="text-sm text-[var(--color-muted)] mt-1 mb-6">Add your first hero slide</p>
              <Button variant="primary" onClick={openCreate}>Add First Slide</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-gray-50)]">
                    <th className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide w-10">⠿</th>
                    <th className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Preview</th>
                    <th className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Title</th>
                    <th className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">CTA</th>
                    <th className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Schedule</th>
                    <th className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slides.map((slide, index) => (
                    <tr
                      key={slide.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      className="border-b border-[var(--color-border)] hover:bg-[var(--color-gray-50)] transition-colors cursor-grab active:cursor-grabbing"
                    >
                      {/* Drag handle */}
                      <td className="px-4 py-4 text-[var(--color-gray-300)] text-lg select-none">⠿</td>

                      {/* Thumbnail */}
                      <td className="px-4 py-4">
                        <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-[var(--color-gray-100)]">
                          {slide.imageUrl && (
                            <Image
                              src={slide.imageUrl}
                              alt={slide.title}
                              fill
                              className="object-cover"
                              sizes="96px"
                              unoptimized
                            />
                          )}
                        </div>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[var(--color-foreground)]">{slide.title}</p>
                        {slide.titleAr && <p className="text-xs text-[var(--color-muted)] mt-0.5" dir="rtl">{slide.titleAr}</p>}
                        {slide.subtitle && <p className="text-xs text-[var(--color-muted)] mt-0.5 line-clamp-1">{slide.subtitle}</p>}
                      </td>

                      {/* CTA */}
                      <td className="px-4 py-4">
                        {slide.ctaLabel ? (
                          <div>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)] text-xs font-medium">
                              {slide.ctaLabel}
                            </span>
                            {slide.ctaLink && (
                              <p className="text-xs text-[var(--color-muted)] mt-1 truncate max-w-32">{slide.ctaLink}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--color-gray-300)] text-xs">No CTA</span>
                        )}
                      </td>

                      {/* Schedule */}
                      <td className="px-4 py-4 text-xs text-[var(--color-muted)]">
                        {slide.startsAt || slide.endsAt ? (
                          <div className="space-y-0.5">
                            {slide.startsAt && <p>From: {new Date(slide.startsAt).toLocaleDateString()}</p>}
                            {slide.endsAt   && <p>Until: {new Date(slide.endsAt).toLocaleDateString()}</p>}
                          </div>
                        ) : (
                          <span className="text-[var(--color-gray-300)]">Always</span>
                        )}
                      </td>

                      {/* Status toggle */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleActive(slide)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)] focus:ring-offset-1 ${
                            slide.isActive ? "bg-[var(--color-brand-navy)]" : "bg-[var(--color-gray-200)]"
                          }`}
                          aria-label={slide.isActive ? "Deactivate slide" : "Activate slide"}
                          title={slide.isActive ? "Active — click to deactivate" : "Inactive — click to activate"}
                        >
                          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                            slide.isActive ? "translate-x-6" : "translate-x-1"
                          }`} />
                        </button>
                        <p className="text-xs text-[var(--color-muted)] mt-1">{slide.isActive ? "Active" : "Inactive"}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(slide)}
                            className="px-3 py-1.5 text-xs font-medium text-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/10 rounded-lg hover:bg-[var(--color-brand-navy)]/20 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(slide)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
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

      {/* ── Add / Edit form modal ── */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Slide" : "Add New Slide"}
        size="xl"
      >
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Image URL + live preview */}
          <div>
            <Input
              id="slide-image-url"
              label="Image URL *"
              value={form.imageUrl}
              onChange={(e) => handleField("imageUrl", e.target.value)}
              placeholder="https://example.com/image.jpg"
              hint="Use a 1600×900 landscape image for best results"
            />
            {imagePreview && (
              <div className="mt-3 relative h-40 rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-gray-100)]">
                <Image src={imagePreview} alt="Preview" fill className="object-cover" sizes="100vw" unoptimized />
                <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <div>
                    <p className="text-white font-bold text-sm">{form.title || "Your Title Here"}</p>
                    {form.subtitle && <p className="text-white/70 text-xs mt-0.5">{form.subtitle}</p>}
                    {form.ctaLabel && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-[var(--color-brand-gold)] text-[var(--color-brand-navy)] text-xs font-bold rounded">
                        {form.ctaLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input id="slide-title" label="Title (EN) *" value={form.title} onChange={(e) => handleField("title", e.target.value)} placeholder="Premium Islamic Fashion" />
            <Input id="slide-title-ar" label="العنوان (AR)" value={form.titleAr} onChange={(e) => handleField("titleAr", e.target.value)} placeholder="أزياء إسلامية فاخرة" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="slide-subtitle" label="Subtitle (EN)" value={form.subtitle} onChange={(e) => handleField("subtitle", e.target.value)} placeholder="Short description..." />
            <Input id="slide-subtitle-ar" label="العنوان الفرعي (AR)" value={form.subtitleAr} onChange={(e) => handleField("subtitleAr", e.target.value)} placeholder="وصف قصير..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="slide-cta-label" label="CTA Button Label (EN)" value={form.ctaLabel} onChange={(e) => handleField("ctaLabel", e.target.value)} placeholder="Shop Now" />
            <Input id="slide-cta-label-ar" label="نص الزر (AR)" value={form.ctaLabelAr} onChange={(e) => handleField("ctaLabelAr", e.target.value)} placeholder="تسوق الآن" />
          </div>
          <Input id="slide-cta-link" label="CTA Link (URL path)" value={form.ctaLink} onChange={(e) => handleField("ctaLink", e.target.value)} placeholder="/category/clothing" />

          <div className="grid grid-cols-2 gap-4">
            <Input id="slide-starts-at" label="Show From (optional)" type="datetime-local" value={form.startsAt} onChange={(e) => handleField("startsAt", e.target.value)} hint="Leave blank to show immediately" />
            <Input id="slide-ends-at" label="Hide After (optional)" type="datetime-local" value={form.endsAt} onChange={(e) => handleField("endsAt", e.target.value)} hint="Leave blank to never expire" />
          </div>
          <Input id="slide-sort-order" label="Sort Order" type="number" value={form.sortOrder.toString()} onChange={(e) => handleField("sortOrder", parseInt(e.target.value) || 0)} hint="Lower number = shown first. Use drag to reorder instead." />

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleField("isActive", !form.isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-[var(--color-brand-navy)]" : "bg-[var(--color-gray-200)]"}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm font-medium text-[var(--color-gray-700)]">
              {form.isActive ? "Active — visible on site" : "Inactive — hidden from site"}
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-[var(--color-border)] mt-4">
          <Button variant="primary" fullWidth size="lg" loading={saving} onClick={handleSave}>
            {editing ? "Save Changes" : "Create Slide"}
          </Button>
          <Button variant="secondary" fullWidth size="lg" onClick={() => setFormOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      {/* ── Delete confirmation modal ── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Slide"
        size="sm"
      >
        <p className="text-sm text-[var(--color-gray-600)] mb-2">
          Are you sure you want to delete this slide?
        </p>
        {deleteTarget && (
          <div className="relative h-24 rounded-lg overflow-hidden bg-[var(--color-gray-100)] mb-4">
            <Image src={deleteTarget.imageUrl} alt={deleteTarget.title} fill className="object-cover" sizes="400px" unoptimized />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <p className="text-white font-bold text-sm">{deleteTarget.title}</p>
            </div>
          </div>
        )}
        <p className="text-xs text-[var(--color-error)] mb-4">This action cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="danger" fullWidth loading={deleting} onClick={handleDelete}>Delete</Button>
          <Button variant="secondary" fullWidth onClick={() => setDeleteTarget(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
