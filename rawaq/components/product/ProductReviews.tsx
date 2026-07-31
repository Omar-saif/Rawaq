"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Modal";

interface ProductReviewsProps {
  slug: string;
}

export function ProductReviews({ slug }: ProductReviewsProps) {
  const locale = useLocale();
  const { addToast } = useToast();
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [avgRating, setAvgRating] = useState("0.0");
  
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    const res = await fetch(`/api/products/${slug}/reviews?page=${pageNum}`);
    if (res.ok) {
      const json = await res.json();
      setReviews(prev => append ? [...prev, ...(json.data ?? [])] : (json.data ?? []));
      setHasMore((json.meta?.page || 1) < (json.meta?.totalPages || 1));
      setTotalCount(json.meta?.total || 0);
      setAvgRating(Number(json.meta?.averageRating || 0).toFixed(1));
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => { fetchReviews(1, false); }, [fetchReviews]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;
    setSubmitting(true);
    
    try {
      const res = await fetch(`/api/products/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title, comment })
      });
      const json = await res.json();
      
      if (res.ok) {
        addToast("success", locale === "ar" ? "تم إضافة التقييم بنجاح" : "Review added successfully");
        setFormOpen(false);
        setTitle("");
        setComment("");
        setRating(5);
        setPage(1);
        fetchReviews(1, false);
      } else {
        if (res.status === 401) {
          addToast("error", locale === "ar" ? "يجب تسجيل الدخول" : "Please login to review");
        } else if (res.status === 403) {
          addToast("error", locale === "ar" ? "يجب شراء المنتج أولاً" : "You must purchase the product to review it");
        } else {
          addToast("error", json.error?.message || "Failed to add review");
        }
      }
    } catch {
      addToast("error", "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-16 border-t border-[var(--color-border)] pt-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-brand-navy)]">
            {locale === "ar" ? "تقييمات العملاء" : "Customer Reviews"}
          </h2>
          {totalCount > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xl text-yellow-400">{"★".repeat(Math.round(Number(avgRating)))}</span>
              <span className="text-sm font-bold">{avgRating} / 5</span>
              <span className="text-sm text-[var(--color-muted)]">({totalCount} {locale === "ar" ? "تقييمات" : "reviews"})</span>
            </div>
          )}
        </div>
        <Button variant="secondary" onClick={() => setFormOpen(!formOpen)}>
          {locale === "ar" ? "اكتب تقييمك" : "Write a Review"}
        </Button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[var(--radius-xl)] border border-[var(--color-border)] mb-8 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">{locale === "ar" ? "التقييم" : "Rating"}</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl ${rating >= star ? "text-yellow-400" : "text-gray-300"}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">{locale === "ar" ? "عنوان التقييم" : "Title (Optional)"}</label>
            <input 
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={locale === "ar" ? "خلاصة رأيك" : "Summarize your review"}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">{locale === "ar" ? "التقييم" : "Review"}</label>
            <textarea 
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg min-h-[100px]"
              value={comment}
              onChange={e => setComment(e.target.value)}
              required
              placeholder={locale === "ar" ? "شاركنا رأيك بالمنتج" : "What did you like or dislike?"}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {locale === "ar" ? "إرسال" : "Submit"}
            </Button>
          </div>
        </form>
      )}

      {loading && reviews.length === 0 ? (
        <div className="text-[var(--color-muted)]">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 bg-[var(--color-gray-50)] rounded-[var(--radius-xl)]">
          <p className="text-[var(--color-muted)]">{locale === "ar" ? "لا توجد تقييمات بعد. كن أول من يقيّم!" : "No reviews yet. Be the first to review!"}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review.id} className="border-b border-[var(--color-border)] pb-6 last:border-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-yellow-400 text-sm">
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </div>
                <span className="font-semibold text-sm">{review.title}</span>
              </div>
              <p className="text-sm text-[var(--color-gray-600)] mb-3">{review.comment}</p>
              <div className="text-xs text-[var(--color-muted)] flex items-center gap-2">
                <span className="font-semibold text-[var(--color-foreground)]">{review.user?.name || "Customer"}</span>
                <span>•</span>
                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {hasMore && (
            <div className="pt-4 flex justify-center">
              <Button variant="secondary" onClick={handleLoadMore} loading={loading}>
                {locale === "ar" ? "عرض المزيد" : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
