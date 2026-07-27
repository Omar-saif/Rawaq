"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal, useToast } from "@/components/ui/Modal";

interface Category {
  id: string; name: string; nameAr: string; slug: string;
  parentId?: string; _count?: { products: number };
  children?: Category[];
}

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Products", icon: "🛍️" },
  { href: "/admin/categories", label: "Categories", icon: "📂", active: true },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/coupons", label: "Coupons", icon: "🏷️" },
  { href: "/admin/slides", label: "Hero Slides", icon: "🎞️" },
  { href: "/account", label: "My Account", icon: "👤" },
];

const EMPTY = { name: "", nameAr: "", slug: "", parentId: "", attributeSchema: "[]" };

export default function AdminCategoriesPage() {
  const { addToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/categories");
    const json = await res.json();
    setCategories(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const setField = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  // Flatten all categories for parent dropdown
  const flat: Category[] = [];
  const flatten = (cats: Category[]) => cats.forEach(c => { flat.push(c); if (c.children) flatten(c.children); });
  flatten(categories);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY }); setFormOpen(true); };
  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, nameAr: c.nameAr, slug: c.slug, parentId: c.parentId ?? "", attributeSchema: "[]" });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) { addToast("warning", "Name and slug are required"); return; }
    setSaving(true);
    try {
      let attrSchema;
      try { attrSchema = JSON.parse(form.attributeSchema); } catch { addToast("error", "Invalid JSON in attribute schema"); setSaving(false); return; }
      const payload = { name: form.name, nameAr: form.nameAr, slug: form.slug, parentId: form.parentId || null, attributeSchema: attrSchema };
      const url = editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error?.message);
      addToast("success", editing ? "Category updated!" : "Category created!");
      setFormOpen(false); fetchCategories();
    } catch (e: any) { addToast("error", e.message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error?.message);
      addToast("success", "Category deleted"); setDeleteTarget(null); fetchCategories();
    } catch (e: any) { addToast("error", e.message ?? "Delete failed"); }
  };

  const renderRow = (cat: Category, depth = 0): React.ReactNode => (
    <React.Fragment key={cat.id}>
      <tr className="border-b border-[var(--color-border)] hover:bg-[var(--color-gray-50)] transition-colors">
        <td className="px-4 py-3">
          <div style={{ paddingInlineStart: depth * 20 }} className="flex items-center gap-2">
            {depth > 0 && <span className="text-[var(--color-gray-300)]">└</span>}
            <span className="font-medium">{cat.name}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm" dir="rtl">{cat.nameAr}</td>
        <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted)]">{cat.slug}</td>
        <td className="px-4 py-3 text-sm text-[var(--color-muted)]">{cat._count?.products ?? 0}</td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <button onClick={() => openEdit(cat)} className="px-2.5 py-1 text-xs font-medium text-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/10 rounded-lg hover:bg-[var(--color-brand-navy)]/20 transition-colors">Edit</button>
            <button onClick={() => setDeleteTarget(cat)} className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Delete</button>
          </div>
        </td>
      </tr>
      {cat.children?.map(child => renderRow(child, depth + 1))}
    </React.Fragment>
  );

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] flex">
      <aside className="w-64 bg-[var(--color-brand-navy)] text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-gold)] mb-1">RAWAQ</p>
          <h1 className="text-lg font-bold">Admin Panel</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {ADMIN_NAV.map(item => (
            <Link key={item.href} href={item.href as any} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${item.active ? "bg-white/15 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[var(--color-brand-navy)]">Categories</h2>
          <Button variant="primary" onClick={openCreate}>+ Add Category</Button>
        </div>

        <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[var(--color-muted)]">Loading…</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-gray-50)]">
                  {["Name", "Arabic Name", "Slug", "Products", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{categories.map(c => renderRow(c))}</tbody>
            </table>
          )}
        </div>
      </main>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Category" : "Add Category"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input id="cat-name" label="Name (EN) *" value={form.name} onChange={e => setField("name", e.target.value)} required />
            <Input id="cat-name-ar" label="الاسم (AR)" value={form.nameAr} onChange={e => setField("nameAr", e.target.value)} />
          </div>
          <Input id="cat-slug" label="Slug *" value={form.slug} onChange={e => setField("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))} hint="URL-friendly: lowercase, hyphens only" required placeholder="my-category" />
          <div>
            <label htmlFor="cat-parent" className="block text-sm font-medium text-[var(--color-gray-700)] mb-1.5">Parent Category (optional)</label>
            <select id="cat-parent" value={form.parentId} onChange={e => setField("parentId", e.target.value)} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-[var(--radius-lg)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)]">
              <option value="">None (top-level)</option>
              {flat.filter(c => c.id !== editing?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-gray-700)] mb-1.5">Attribute Schema (JSON)</label>
            <textarea value={form.attributeSchema} onChange={e => setField("attributeSchema", e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-[var(--radius-lg)] text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)] resize-none"
              rows={4} placeholder='[{"name":"Size","type":"select","options":["S","M","L"]}]' />
            <p className="text-xs text-[var(--color-muted)] mt-1">Valid JSON array of attribute objects</p>
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-[var(--color-border)] mt-4">
          <Button variant="primary" fullWidth size="lg" loading={saving} onClick={handleSave}>{editing ? "Save Changes" : "Create Category"}</Button>
          <Button variant="secondary" fullWidth size="lg" onClick={() => setFormOpen(false)}>Cancel</Button>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Category" size="sm">
        <p className="text-sm text-[var(--color-gray-600)] mb-1">Delete <strong>{deleteTarget?.name}</strong>?</p>
        <p className="text-xs text-[var(--color-error)] mb-4">Products in this category will need to be reassigned.</p>
        <div className="flex gap-3">
          <Button variant="danger" fullWidth onClick={handleDelete}>Delete</Button>
          <Button variant="secondary" fullWidth onClick={() => setDeleteTarget(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
