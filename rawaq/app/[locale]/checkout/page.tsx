"use client";

import React, { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { useCart } from "@/components/layout/CartContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PriceTag } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Modal";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

type Step = "info" | "review";

interface AddressForm {
  name: string; email: string; phone: string;
  line1: string; line2: string; city: string;
  state: string; postalCode: string; country: string;
}

interface SavedAddress {
  id: string; label: string; recipientName: string;
  line1: string; line2?: string; city: string;
  state?: string; postalCode?: string; country: string;
  phone?: string;
}

const EMPTY_ADDR: AddressForm = {
  name: "", email: "", phone: "",
  line1: "", line2: "", city: "",
  state: "", postalCode: "", country: "SA",
};

export default function CheckoutPage() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const { addToast } = useToast();
  const { items, subtotal, coupon, clearCart } = useCart();

  const [step, setStep] = useState<Step>("info");
  const [form, setForm] = useState<AddressForm>(EMPTY_ADDR);
  const [errors, setErrors] = useState<Partial<AddressForm>>({});
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  // Fetch delivery vendors
  useEffect(() => {
    fetch("/api/delivery-vendors")
      .then(res => res.json())
      .then(json => {
        const v = json.data ?? [];
        setVendors(v);
        if (v.length > 0) setSelectedVendorId(v[0].id);
      })
      .catch(() => {})
      .finally(() => setVendorsLoading(false));
  }, []);

  // Redirect empty cart
  useEffect(() => {
    if (items.length === 0) router.push("/cart");
  }, [items, router]);

  // Check auth & load saved addresses
  useEffect(() => {
    fetch("/api/auth/me").then(async (res) => {
      if (res.ok) {
        setIsLoggedIn(true);
        const addrRes = await fetch("/api/account/addresses");
        if (addrRes.ok) {
          const json = await addrRes.json();
          setSavedAddresses(json.data ?? []);
          if (json.data?.length > 0) setSelectedAddressId(json.data[0].id);
        }
      }
    }).catch(() => {});
  }, []);

  const discountAmount = coupon?.discountAmount ?? 0;
  const subtotalAfterDiscount = coupon?.newTotal ?? subtotal;
  const shippingCost = selectedVendorId ? parseFloat(vendors.find(v => v.id === selectedVendorId)?.price || "0") : 0;
  const total = subtotalAfterDiscount + shippingCost;

  const setField = (field: keyof AddressForm, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<AddressForm> = {};
    if (!form.name) e.name = "Required";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    if (!form.phone) e.phone = "Required";
    if (!form.line1) e.line1 = "Required";
    if (!form.city) e.city = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNextStep = () => {
    if (isLoggedIn && selectedAddressId) { setStep("review"); return; }
    if (validate()) setStep("review");
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch("/api/cart/validate-coupon", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          cartSubtotal: subtotal,
          cartItems: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        }),
      });
      const json = await res.json();
      if (!res.ok) addToast("error", json.error?.message ?? "Invalid coupon");
      else { addToast("success", "Coupon applied!"); }
    } finally { setCouponLoading(false); }
  };

  const handlePlaceOrder = async () => {
    if (!selectedVendorId) {
      addToast("warning", locale === "ar" ? "الرجاء اختيار طريقة التوصيل" : "Please select a delivery method");
      return;
    }
    setPlacing(true);
    try {
      const payload: any = {
        cartItems: items.map((i) => ({
          productId: i.productId, variantId: i.variantId, quantity: i.quantity,
        })),
        couponCode: coupon?.code,
        deliveryVendorId: selectedVendorId,
      };

      if (!isLoggedIn) {
        payload.guest = {
          email: form.email,
          phone: form.phone,
          address: {
            street: form.line1 + (form.line2 ? `, ${form.line2}` : ""),
            city: form.city,
            country: form.country,
            postalCode: form.postalCode || undefined,
          },
        };
      } else if (selectedAddressId && selectedAddressId !== "new") {
        payload.savedAddressId = selectedAddressId;
      } else {
        payload.newAddress = {
          street: form.line1 + (form.line2 ? `, ${form.line2}` : ""),
          city: form.city,
          country: form.country,
          postalCode: form.postalCode || undefined,
        };
      }

      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast("error", json.error?.message ?? "Order failed. Please try again.");
        return;
      }
      clearCart();
      router.push(`/order-confirmation?id=${json.data.id}&email=${encodeURIComponent(!isLoggedIn ? form.email : "")}`);
    } catch {
      addToast("error", "Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <>
      <Header />
      <main className="flex-1 bg-[var(--color-gray-50)] py-10 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Step indicator */}
          <div className="flex items-center gap-4 mb-8">
            {(["info", "review"] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    s === step || (s === "info" && step === "review")
                      ? "bg-[var(--color-brand-navy)] text-white"
                      : "bg-[var(--color-gray-200)] text-[var(--color-gray-500)]"
                  }`}>{i + 1}</div>
                  <span className={`text-sm font-medium hidden sm:block ${s === step ? "text-[var(--color-brand-navy)]" : "text-[var(--color-muted)]"}`}>
                    {s === "info" ? (locale === "ar" ? "معلومات الشحن" : "Shipping Info") : (locale === "ar" ? "مراجعة وتأكيد" : "Review & Confirm")}
                  </span>
                </div>
                {i < 1 && <div className="flex-1 h-px bg-[var(--color-border)]" />}
              </React.Fragment>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* ── LEFT: Form ── */}
            <div className="lg:col-span-2 space-y-6">

              {step === "info" && (
                <>
                  {/* Saved addresses for logged-in users */}
                  {isLoggedIn && savedAddresses.length > 0 && (
                    <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
                      <h2 className="text-base font-bold text-[var(--color-brand-navy)] mb-4">
                        {locale === "ar" ? "عناوين محفوظة" : "Saved Addresses"}
                      </h2>
                      <div className="space-y-3">
                        {savedAddresses.map((addr) => (
                          <label key={addr.id} className={`flex items-start gap-3 p-4 rounded-[var(--radius-lg)] border-2 cursor-pointer transition-all ${
                            selectedAddressId === addr.id
                              ? "border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/5"
                              : "border-[var(--color-border)] hover:border-[var(--color-gray-300)]"
                          }`}>
                            <input
                              type="radio" name="address" value={addr.id}
                              checked={selectedAddressId === addr.id}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1"
                            />
                            <div>
                              <p className="font-semibold text-sm">{addr.label || addr.recipientName}</p>
                              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}
                                {addr.state ? `, ${addr.state}` : ""} — {addr.country}
                              </p>
                              {addr.phone && <p className="text-xs text-[var(--color-muted)]">{addr.phone}</p>}
                            </div>
                          </label>
                        ))}
                        <label className={`flex items-start gap-3 p-4 rounded-[var(--radius-lg)] border-2 cursor-pointer transition-all ${
                          selectedAddressId === "new"
                            ? "border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/5"
                            : "border-[var(--color-border)] hover:border-[var(--color-gray-300)]"
                        }`}>
                          <input
                            type="radio" name="address" value="new"
                            checked={selectedAddressId === "new"}
                            onChange={() => setSelectedAddressId("new")}
                            className="mt-1"
                          />
                          <span className="text-sm font-medium">{locale === "ar" ? "+ عنوان جديد" : "+ New address"}</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* New address form (guests or "new" selected) */}
                  {(!isLoggedIn || savedAddresses.length === 0 || selectedAddressId === "new") && (
                    <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6 space-y-4">
                      <h2 className="text-base font-bold text-[var(--color-brand-navy)]">
                        {locale === "ar" ? "معلومات الشحن" : "Shipping Information"}
                      </h2>
                      <div className="grid grid-cols-2 gap-4">
                        <Input id="checkout-name" label={locale === "ar" ? "الاسم الكامل" : "Full Name"} required value={form.name} onChange={(e) => setField("name", e.target.value)} error={errors.name} placeholder="Ahmed Al-Rashid" />
                        <Input id="checkout-email" label={locale === "ar" ? "البريد الإلكتروني" : "Email"} type="email" required value={form.email} onChange={(e) => setField("email", e.target.value)} error={errors.email} placeholder="you@example.com" />
                      </div>
                      <Input id="checkout-phone" label={locale === "ar" ? "رقم الجوال" : "Phone"} type="tel" required value={form.phone} onChange={(e) => setField("phone", e.target.value)} error={errors.phone} placeholder="+966 5X XXX XXXX" />
                      <Input id="checkout-line1" label={locale === "ar" ? "العنوان" : "Address Line 1"} required value={form.line1} onChange={(e) => setField("line1", e.target.value)} error={errors.line1} placeholder={locale === "ar" ? "الشارع، رقم المبنى" : "Street, Building No."} />
                      <Input id="checkout-line2" label={locale === "ar" ? "العنوان (سطر 2 - اختياري)" : "Address Line 2 (optional)"} value={form.line2} onChange={(e) => setField("line2", e.target.value)} placeholder={locale === "ar" ? "الحي، الطابق" : "District, Floor"} />
                      <div className="grid grid-cols-2 gap-4">
                        <Input id="checkout-city" label={locale === "ar" ? "المدينة" : "City"} required value={form.city} onChange={(e) => setField("city", e.target.value)} error={errors.city} placeholder="Riyadh" />
                        <Input id="checkout-state" label={locale === "ar" ? "المنطقة" : "Region"} value={form.state} onChange={(e) => setField("state", e.target.value)} placeholder="Riyadh Region" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input id="checkout-postal" label={locale === "ar" ? "الرمز البريدي" : "Postal Code"} value={form.postalCode} onChange={(e) => setField("postalCode", e.target.value)} placeholder="12345" />
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="checkout-country" className="text-sm font-medium text-[var(--color-gray-700)]">{locale === "ar" ? "الدولة" : "Country"}</label>
                          <select id="checkout-country" value={form.country} onChange={(e) => setField("country", e.target.value)}
                            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-[var(--radius-lg)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)]">
                            <option value="SA">Saudi Arabia 🇸🇦</option>
                            <option value="AE">UAE 🇦🇪</option>
                            <option value="KW">Kuwait 🇰🇼</option>
                            <option value="QA">Qatar 🇶🇦</option>
                            <option value="BH">Bahrain 🇧🇭</option>
                            <option value="OM">Oman 🇴🇲</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button variant="primary" fullWidth size="lg" onClick={handleNextStep}>
                    {locale === "ar" ? "المتابعة للمراجعة →" : "Continue to Review →"}
                  </Button>
                </>
              )}

              {step === "review" && (
                <>
                  <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-[var(--color-brand-navy)]">
                        {locale === "ar" ? "مراجعة الطلب" : "Order Review"}
                      </h2>
                      <button onClick={() => setStep("info")} className="text-xs text-[var(--color-brand-navy)] hover:underline">
                        {locale === "ar" ? "← تعديل" : "← Edit"}
                      </button>
                    </div>

                    {/* Items */}
                    <ul className="divide-y divide-[var(--color-border)]">
                      {items.map((item, i) => (
                        <li key={i} className="flex gap-4 py-4">
                          <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-[var(--color-gray-100)] shrink-0">
                            {item.image && <Image src={item.image} alt={item.title} fill className="object-cover" sizes="64px" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold line-clamp-2">{locale === "ar" && item.titleAr ? item.titleAr : item.title}</p>
                            {item.variantLabel && <p className="text-xs text-[var(--color-muted)] mt-0.5">{item.variantLabel}</p>}
                            <p className="text-xs text-[var(--color-muted)] mt-1">{locale === "ar" ? "الكمية" : "Qty"}: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-bold text-[var(--color-brand-navy)] whitespace-nowrap">
                            {(item.price * item.quantity).toFixed(2)} SAR
                          </p>
                        </li>
                      ))}
                    </ul>

                    {/* Delivery method */}
                    <div className="mt-6 border-t border-[var(--color-border)] pt-6">
                      <h3 className="text-sm font-bold text-[var(--color-brand-navy)] mb-4">
                        {locale === "ar" ? "طريقة التوصيل" : "Delivery Method"}
                      </h3>
                      {vendorsLoading ? (
                        <p className="text-sm text-[var(--color-muted)]">{locale === "ar" ? "جاري تحميل طرق التوصيل..." : "Loading delivery options..."}</p>
                      ) : vendors.length === 0 ? (
                        <p className="text-sm text-red-500">{locale === "ar" ? "لا توجد طرق توصيل متاحة حالياً." : "No delivery options available right now."}</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {vendors.map((vendor) => (
                            <label
                              key={vendor.id}
                              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                                selectedVendorId === vendor.id
                                  ? "border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/5"
                                  : "border-[var(--color-border)] hover:border-[var(--color-brand-navy)]"
                              }`}
                            >
                              <input
                                type="radio"
                                name="deliveryVendor"
                                value={vendor.id}
                                checked={selectedVendorId === vendor.id}
                                onChange={() => setSelectedVendorId(vendor.id)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-bold text-[var(--color-brand-navy)]">{locale === "ar" && vendor.nameAr ? vendor.nameAr : vendor.name}</p>
                                <p className="text-xs text-[var(--color-muted)] mt-0.5">{locale === "ar" && vendor.estimatedDaysAr ? vendor.estimatedDaysAr : vendor.estimatedDays}</p>
                              </div>
                              <p className="text-sm font-semibold text-[var(--color-brand-navy)]">
                                {parseFloat(vendor.price) === 0 ? (locale === "ar" ? "مجاني" : "Free") : `${parseFloat(vendor.price).toFixed(2)} SAR`}
                              </p>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Payment method */}
                    <div className="mt-6 p-4 bg-[var(--color-gray-50)] rounded-[var(--radius-lg)] flex items-center gap-3">
                      <span className="text-xl">💵</span>
                      <div>
                        <p className="text-sm font-semibold">{locale === "ar" ? "الدفع عند الاستلام" : "Cash on Delivery"}</p>
                        <p className="text-xs text-[var(--color-muted)]">{locale === "ar" ? "ادفع عند وصول طلبك" : "Pay when your order arrives"}</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    id="place-order-btn"
                    variant="primary" fullWidth size="lg"
                    loading={placing} onClick={handlePlaceOrder}
                  >
                    {locale === "ar" ? "تأكيد الطلب ✓" : "Place Order ✓"}
                  </Button>
                  <p className="text-center text-xs text-[var(--color-muted)]">
                    {locale === "ar"
                      ? "بالنقر على تأكيد الطلب، أنت توافق على شروط الخدمة وسياسة الخصوصية"
                      : "By placing your order, you agree to our Terms of Service and Privacy Policy"}
                  </p>
                </>
              )}
            </div>

            {/* ── RIGHT: Order summary ── */}
            <div className="space-y-4">
              <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6 sticky top-24">
                <h2 className="text-base font-bold text-[var(--color-brand-navy)] mb-4">
                  {locale === "ar" ? "ملخص الطلب" : "Order Summary"}
                </h2>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-[var(--color-muted)]">
                    <span>{locale === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                    <span>{subtotal.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between text-[var(--color-muted)]">
                    <span>{locale === "ar" ? "الشحن" : "Shipping"}</span>
                    <span className="font-medium text-[var(--color-brand-navy)]">
                      {shippingCost === 0 ? (locale === "ar" ? "مجاني" : "Free") : `${shippingCost.toFixed(2)} SAR`}
                    </span>
                  </div>
                  {coupon && (
                    <div className="flex justify-between text-green-600">
                      <span>{locale === "ar" ? "خصم" : "Discount"} ({coupon.code})</span>
                      <span>−{discountAmount.toFixed(2)} SAR</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-3 border-t border-[var(--color-border)] text-[var(--color-brand-navy)]">
                    <span>{locale === "ar" ? "الإجمالي" : "Total"}</span>
                    <span>{total.toFixed(2)} SAR</span>
                  </div>
                </div>

                {/* Coupon input in summary */}
                {!coupon && (
                  <div className="flex gap-2">
                    <input
                      id="checkout-coupon" value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder={locale === "ar" ? "كود الخصم" : "Coupon code"}
                      className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-lg)] text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)]"
                    />
                    <Button variant="outline-gold" size="sm" loading={couponLoading} onClick={handleApplyCoupon}>
                      {locale === "ar" ? "تطبيق" : "Apply"}
                    </Button>
                  </div>
                )}

                {coupon && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 font-medium">
                    ✓ {coupon.code} — {locale === "ar" ? "خصم مطبق" : "Discount applied"}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-2 text-xs text-[var(--color-muted)]">
                  <div className="flex items-center gap-2">🔒 <span>{locale === "ar" ? "بيانات آمنة ومشفرة" : "Secure checkout"}</span></div>
                  <div className="flex items-center gap-2">🚚 <span>{locale === "ar" ? "شحن مجاني للطلبات فوق 300 ر.س" : "Free shipping over 300 SAR"}</span></div>
                  <div className="flex items-center gap-2">🔄 <span>{locale === "ar" ? "إرجاع مجاني خلال 14 يوم" : "Free returns within 14 days"}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
