"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal, useToast } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";

interface Product {
  id: string; title: string; titleAr: string; slug: string;
  sku: string; price: number; salePrice?: number; inventoryCount: number;
  isActive: boolean; images: string[];
  category: { name: string; id: string };
}

interface Category { id: string; name: string; }

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Products", icon: "🛍️", active: true },
  { href: "/admin/categories", label: "Categories", icon: "📂" },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/coupons", label: "Coupons", icon: "🏷️" },
  { href: "/admin/slides", label: "Hero Slides", icon: "🎞️" },
  { href: "/account", label: "My Account", icon: "👤" },
];

const EMPTY_FORM = {
  title: "", titleAr: "", description: "", descriptionAr: "",
  sku: "", price: "", salePrice: "", inventoryCount: "0",
  categoryId: "", images: [] as string[], isActive: true,
};

function ImageManager({ images, onChange }: { images: string[], onChange: (imgs: string[]) => void }) {
  const [newUrl, setNewUrl] = useState("");
  const addImage = () => { if (newUrl.trim()) { onChange([...images, newUrl.trim()]); setNewUrl(""); } };
  const removeImage = (i: number) => { onChange(images.filter((_, idx) => idx !== i)); };
  
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  
  const onDragStart = (e: React.DragEvent, i: number) => { setDragIndex(i); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    const newImages = [...images];
    const dragged = newImages[dragIndex];
    newImages.splice(dragIndex, 1);
    newImages.splice(i, 0, dragged);
    onChange(newImages);
    setDragIndex(i);
  };
  const onDragEnd = () => setDragIndex(null);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[var(--color-gray-700)]">Product Images (Drag to reorder)</label>
      <div className="flex gap-2">
        <input 
          type="text"
          placeholder="https://..." 
          value={newUrl} 
          onChange={e => setNewUrl(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
          className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)]"
        />
        <Button variant="secondary" onClick={addImage} type="button">Add</Button>
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mt-2">
          {images.map((img, i) => (
            <div 
              key={img + i} 
              draggable 
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDragEnd={onDragEnd}
              className={`relative h-24 rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing ${dragIndex === i ? 'border-[var(--color-brand-navy)] opacity-50' : 'border-transparent bg-[var(--color-gray-100)]'}`}
            >
              <Image src={img} alt="Preview" fill className="object-cover" unoptimized sizes="20vw" />
              <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-600 z-10 transition-colors">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), pageSize: "20" });
      if (search) params.set("q", search);
      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();
      setProducts(json.data ?? []);
      setTotalPages(json.meta?.totalPages ?? 1);
      setTotal(json.meta?.total ?? 0);
    } catch { addToast("error", "Failed to load products"); }
    finally { setLoading(false); }
  }, [page, search, addToast]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(j => setCategories(j.data ?? []));
  }, []);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const setField = (f: string, v: string | boolean | string[]) => setForm(p => ({ ...p, [f]: v }));

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? "" }); setFormOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      title: p.title, titleAr: p.titleAr, description: "", descriptionAr: "",
      sku: p.sku, price: p.price.toString(), salePrice: p.salePrice?.toString() ?? "",
      inventoryCount: p.inventoryCount.toString(), categoryId: p.category.id,
      images: p.images ?? [], isActive: p.isActive,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.sku || !form.price || !form.categoryId) {
      addToast("warning", "Title, SKU, price and category are required"); return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title, titleAr: form.titleAr, sku: form.sku,
        price: parseFloat(form.price), salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        inventoryCount: parseInt(form.inventoryCount) || 0,
        categoryId: form.categoryId, isActive: form.isActive,
        images: form.images,
        description: form.description || "", descriptionAr: form.descriptionAr || "",
      };
      const url = editing ? `/api/admin/products/${editing.id}` : "/api/admin/products";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error?.message);
      addToast("success", editing ? "Product updated!" : "Product created!");
      setFormOpen(false); fetchProducts();
    } catch (e: any) { addToast("error", e.message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      addToast("success", "Product deleted"); setDeleteTarget(null); fetchProducts();
    } catch { addToast("error", "Delete failed"); }
  };

  const toggleActive = async (p: Product) => {
    await fetch(`/api/admin/products/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !p.isActive }) });
    setProducts(prev => prev.map(pr => pr.id === p.id ? { ...pr, isActive: !pr.isActive } : pr));
  };

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] flex">
      {/* Sidebar */}
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

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)]">Products</h2>
            <p className="text-sm text-[var(--color-muted)] mt-1">{total} products total</p>
          </div>
          <Button variant="primary" onClick={openCreate}>+ Add Product</Button>
        </div>

        {/* Search */}
        <div className="mb-4 flex gap-3">
          <div className="flex-1 max-w-sm">
            <Input id="product-search" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search products..." />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[var(--color-muted)]">Loading…</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-3xl mb-3">🛍️</p>
              <p className="font-semibold text-[var(--color-gray-700)] mb-4">No products found</p>
              <Button variant="primary" onClick={openCreate}>Add First Product</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-gray-50)]">
                    {["Image", "Product", "SKU", "Category", "Price", "Stock", "Status", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-gray-50)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-12 h-14 rounded-lg overflow-hidden bg-[var(--color-gray-100)] relative">
                          {p.images[0] && <Image src={p.images[0]} alt={p.title} fill className="object-cover" sizes="48px" unoptimized />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[var(--color-foreground)] line-clamp-1">{p.title}</p>
                        <p className="text-xs text-[var(--color-muted)] mt-0.5 line-clamp-1" dir="rtl">{p.titleAr}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted)]">{p.sku}</td>
                      <td className="px-4 py-3 text-xs">{p.category?.name}</td>
                      <td className="px-4 py-3">
                        {p.salePrice ? (
                          <div>
                            <span className="font-bold text-[var(--color-brand-navy)]">{p.salePrice} SAR</span>
                            <span className="text-xs text-[var(--color-muted)] line-through ms-1">{p.price}</span>
                          </div>
                        ) : <span className="font-semibold">{p.price} SAR</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.inventoryCount > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {p.inventoryCount > 0 ? p.inventoryCount : "Out of stock"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(p)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p.isActive ? "bg-[var(--color-brand-navy)]" : "bg-[var(--color-gray-200)]"}`}>
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${p.isActive ? "translate-x-4.5" : "translate-x-0.5"}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(p)} className="px-2.5 py-1 text-xs font-medium text-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/10 rounded-lg hover:bg-[var(--color-brand-navy)]/20 transition-colors">Edit</button>
                          <button onClick={() => setDeleteTarget(p)} className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-[var(--color-gray-100)] transition-colors">← Prev</button>
            <span className="px-3 py-1.5 text-sm">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-[var(--color-gray-100)] transition-colors">Next →</button>
          </div>
        )}
      </main>

      {/* Form modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Product" : "Add New Product"} size="xl">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <Input id="prod-title" label="Title (EN) *" value={form.title} onChange={e => setField("title", e.target.value)} required />
            <Input id="prod-title-ar" label="العنوان (AR)" value={form.titleAr} onChange={e => setField("titleAr", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Textarea id="prod-desc" label="Description (EN)" value={form.description} onChange={e => setField("description", e.target.value)} rows={3} />
            <Textarea id="prod-desc-ar" label="الوصف (AR)" value={form.descriptionAr} onChange={e => setField("descriptionAr", e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input id="prod-sku" label="SKU *" value={form.sku} onChange={e => setField("sku", e.target.value)} required placeholder="RWQ-001" />
            <Input id="prod-price" label="Price (SAR) *" type="number" value={form.price} onChange={e => setField("price", e.target.value)} required />
            <Input id="prod-sale" label="Sale Price (SAR)" type="number" value={form.salePrice} onChange={e => setField("salePrice", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="prod-stock" label="Inventory Count" type="number" value={form.inventoryCount} onChange={e => setField("inventoryCount", e.target.value)} />
            <div>
              <label htmlFor="prod-cat" className="block text-sm font-medium text-[var(--color-gray-700)] mb-1.5">Category *</label>
              <select id="prod-cat" value={form.categoryId} onChange={e => setField("categoryId", e.target.value)} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-[var(--radius-lg)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)]">
                <option value="">Select category…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <ImageManager images={form.images} onChange={(imgs) => setField("images", imgs)} />
          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => setField("isActive", !form.isActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-[var(--color-brand-navy)]" : "bg-[var(--color-gray-200)]"}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm font-medium">{form.isActive ? "Active — visible in store" : "Inactive — hidden from store"}</span>
          </label>
        </div>
        <div className="flex gap-3 pt-4 border-t border-[var(--color-border)] mt-4">
          <Button variant="primary" fullWidth size="lg" loading={saving} onClick={handleSave}>{editing ? "Save Changes" : "Create Product"}</Button>
          <Button variant="secondary" fullWidth size="lg" onClick={() => setFormOpen(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Product" size="sm">
        <p className="text-sm text-[var(--color-gray-600)] mb-2">Delete <strong>{deleteTarget?.title}</strong>? This cannot be undone.</p>
        <div className="flex gap-3 mt-4">
          <Button variant="danger" fullWidth onClick={handleDelete}>Delete</Button>
          <Button variant="secondary" fullWidth onClick={() => setDeleteTarget(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
