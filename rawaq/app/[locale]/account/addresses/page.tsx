"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal, useToast } from "@/components/ui/Modal";
import { redirect } from "next/navigation";

interface Address {
  id: string; label?: string; recipientName: string;
  line1: string; line2?: string; city: string;
  state?: string; postalCode?: string; country: string;
  phone?: string; isDefault: boolean;
}

const EMPTY = {
  label: "", recipientName: "", phone: "",
  line1: "", line2: "", city: "",
  state: "", postalCode: "", country: "SA", isDefault: false,
};

export default function AddressesPage() {
  const locale = useLocale();
  const { addToast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const fetchAddresses = useCallback(async () => {
    const res = await fetch("/api/account/addresses");
    if (res.ok) setAddresses((await res.json()).data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY }); setFormOpen(true); };
  const openEdit = (addr: Address) => {
    setEditing(addr);
    setForm({
      label: addr.label ?? "", recipientName: addr.recipientName, phone: addr.phone ?? "",
      line1: addr.line1, line2: addr.line2 ?? "", city: addr.city,
      state: addr.state ?? "", postalCode: addr.postalCode ?? "", country: addr.country, isDefault: addr.isDefault,
    });
    setFormOpen(true);
  };

  const setField = (field: string, val: string | boolean) => setForm((p) => ({ ...p, [field]: val }));

  const handleSave = async () => {
    if (!form.recipientName || !form.line1 || !form.city) { addToast("warning", "Name, address and city are required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, line2: form.line2 || undefined, label: form.label || undefined, phone: form.phone || undefined, state: form.state || undefined, postalCode: form.postalCode || undefined };
      const url = editing ? `/api/account/addresses/${editing.id}` : "/api/account/addresses";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error?.message);
      addToast("success", editing ? (locale === "ar" ? "تم تحديث العنوان" : "Address updated!") : (locale === "ar" ? "تمت إضافة العنوان" : "Address added!"));
      setFormOpen(false);
      fetchAddresses();
    } catch (e: any) { addToast("error", e.message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    if (res.ok) { setDeleteTarget(null); fetchAddresses(); addToast("success", locale === "ar" ? "تم حذف العنوان" : "Address deleted"); }
    else addToast("error", "Delete failed");
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-[var(--color-gray-50)] py-10 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Link href="/account" className="text-[var(--color-muted)] hover:text-[var(--color-brand-navy)] text-sm">← {locale === "ar" ? "حسابي" : "Account"}</Link>
              <h1 className="text-2xl font-bold text-[var(--color-brand-navy)]">{locale === "ar" ? "عناويني" : "My Addresses"}</h1>
            </div>
            <Button variant="primary" onClick={openCreate}>+ {locale === "ar" ? "إضافة عنوان" : "Add Address"}</Button>
          </div>

          {loading ? (
            <div className="grid gap-4">
              {[1,2].map(i => <div key={i} className="skeleton h-32 rounded-[var(--radius-xl)]" />)}
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-white rounded-[var(--radius-2xl)] border border-[var(--color-border)] p-16 text-center">
              <p className="text-5xl mb-4">📍</p>
              <h2 className="text-xl font-bold text-[var(--color-gray-700)] mb-2">{locale === "ar" ? "لا توجد عناوين بعد" : "No addresses yet"}</h2>
              <p className="text-[var(--color-muted)] mb-6">{locale === "ar" ? "أضف عنواناً لتسريع الطلبات المستقبلية" : "Add an address to speed up future orders"}</p>
              <Button variant="primary" onClick={openCreate}>+ {locale === "ar" ? "إضافة عنوان" : "Add Address"}</Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className={`bg-white rounded-[var(--radius-xl)] border-2 p-5 flex flex-col gap-3 ${addr.isDefault ? "border-[var(--color-brand-navy)]" : "border-[var(--color-border)]"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {addr.label && <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-brand-gold)] mb-1">{addr.label}</p>}
                      <p className="font-semibold text-[var(--color-foreground)]">{addr.recipientName}</p>
                    </div>
                    {addr.isDefault && (
                      <span className="px-2 py-0.5 bg-[var(--color-brand-navy)] text-white text-xs rounded-full whitespace-nowrap">{locale === "ar" ? "افتراضي" : "Default"}</span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--color-gray-600)] space-y-0.5">
                    <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                    <p>{addr.city}{addr.state ? `, ${addr.state}` : ""}{addr.postalCode ? ` ${addr.postalCode}` : ""}</p>
                    <p>{addr.country}</p>
                    {addr.phone && <p className="text-[var(--color-muted)]">{addr.phone}</p>}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-[var(--color-border)]">
                    <button onClick={() => openEdit(addr)} className="flex-1 text-center text-xs font-medium text-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/10 px-3 py-2 rounded-lg hover:bg-[var(--color-brand-navy)]/20 transition-colors">
                      {locale === "ar" ? "تعديل" : "Edit"}
                    </button>
                    <button onClick={() => setDeleteTarget(addr.id)} className="flex-1 text-center text-xs font-medium text-red-600 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors">
                      {locale === "ar" ? "حذف" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Add/Edit modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? (locale === "ar" ? "تعديل العنوان" : "Edit Address") : (locale === "ar" ? "إضافة عنوان جديد" : "Add New Address")} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <Input id="addr-label" label={locale === "ar" ? "تسمية (مثل: المنزل)" : "Label (e.g. Home)"} value={form.label} onChange={e => setField("label", e.target.value)} placeholder="Home / Office" />
            <Input id="addr-name" label={locale === "ar" ? "اسم المستلم *" : "Recipient Name *"} value={form.recipientName} onChange={e => setField("recipientName", e.target.value)} required />
          </div>
          <Input id="addr-phone" label={locale === "ar" ? "رقم الجوال" : "Phone"} value={form.phone} onChange={e => setField("phone", e.target.value)} />
          <Input id="addr-line1" label={locale === "ar" ? "العنوان *" : "Address Line 1 *"} value={form.line1} onChange={e => setField("line1", e.target.value)} required />
          <Input id="addr-line2" label={locale === "ar" ? "العنوان (سطر 2)" : "Address Line 2"} value={form.line2} onChange={e => setField("line2", e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="addr-city" label={locale === "ar" ? "المدينة *" : "City *"} value={form.city} onChange={e => setField("city", e.target.value)} required />
            <Input id="addr-state" label={locale === "ar" ? "المنطقة" : "State/Region"} value={form.state} onChange={e => setField("state", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="addr-postal" label={locale === "ar" ? "الرمز البريدي" : "Postal Code"} value={form.postalCode} onChange={e => setField("postalCode", e.target.value)} />
            <div>
              <label htmlFor="addr-country" className="block text-sm font-medium text-[var(--color-gray-700)] mb-1.5">{locale === "ar" ? "الدولة" : "Country"}</label>
              <select id="addr-country" value={form.country} onChange={e => setField("country", e.target.value)} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-[var(--radius-lg)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)]">
                <option value="SA">Saudi Arabia</option><option value="AE">UAE</option>
                <option value="KW">Kuwait</option><option value="QA">Qatar</option>
                <option value="BH">Bahrain</option><option value="OM">Oman</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={e => setField("isDefault", e.target.checked)} className="w-4 h-4 accent-[var(--color-brand-navy)]" />
            <span className="text-sm font-medium">{locale === "ar" ? "تعيين كعنوان افتراضي" : "Set as default address"}</span>
          </label>
        </div>
        <div className="flex gap-3 pt-4 border-t border-[var(--color-border)] mt-4">
          <Button variant="primary" fullWidth size="lg" loading={saving} onClick={handleSave}>{editing ? (locale === "ar" ? "حفظ التغييرات" : "Save Changes") : (locale === "ar" ? "إضافة العنوان" : "Add Address")}</Button>
          <Button variant="secondary" fullWidth size="lg" onClick={() => setFormOpen(false)}>{locale === "ar" ? "إلغاء" : "Cancel"}</Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={locale === "ar" ? "حذف العنوان" : "Delete Address"} size="sm">
        <p className="text-sm text-[var(--color-gray-600)] mb-4">{locale === "ar" ? "هل أنت متأكد من حذف هذا العنوان؟ لا يمكن التراجع." : "Are you sure you want to delete this address? This cannot be undone."}</p>
        <div className="flex gap-3">
          <Button variant="danger" fullWidth onClick={() => deleteTarget && handleDelete(deleteTarget)}>{locale === "ar" ? "حذف" : "Delete"}</Button>
          <Button variant="secondary" fullWidth onClick={() => setDeleteTarget(null)}>{locale === "ar" ? "إلغاء" : "Cancel"}</Button>
        </div>
      </Modal>
    </>
  );
}
