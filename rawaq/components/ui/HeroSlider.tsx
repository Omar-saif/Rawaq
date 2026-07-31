"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useRouter } from "@/lib/i18n/navigation";

export interface SlideData {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string | null;
  subtitleAr: string | null;
  imageUrl: string;
  ctaLabel: string | null;
  ctaLabelAr: string | null;
  ctaLink: string | null;
}

// ── Static fallback shown when zero active slides exist ───────────────────────
const FALLBACK_SLIDE: SlideData = {
  id: "fallback",
  title: "Premium Islamic Fashion & Perfumes",
  titleAr: "أزياء إسلامية فاخرة وعطور عربية",
  subtitle: "Crafted with tradition. Delivered to your door.",
  subtitleAr: "مصنوعة بإتقان. تُوصَّل إلى بابك.",
  imageUrl: "",   // no image — gradient only
  ctaLabel: "Shop Now",
  ctaLabelAr: "تسوق الآن",
  ctaLink: "/category/clothing",
};

interface HeroSliderProps {
  slides: SlideData[];
}

export function HeroSlider({ slides: initialSlides }: HeroSliderProps) {
  const locale = useLocale();
  const router = useRouter();
  const slides = initialSlides.length > 0 ? initialSlides : [FALLBACK_SLIDE];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number) => {
    if (animating || index === current) return;
    setAnimating(true);
    setCurrent(index);
    setTimeout(() => setAnimating(false), 600);
  }, [animating, current]);

  const goNext = useCallback(() => goTo((current + 1) % slides.length), [goTo, current, slides.length]);
  const goPrev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [goTo, current, slides.length]);

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1) return;
    if (!paused) {
      intervalRef.current = setInterval(goNext, 5000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [goNext, paused, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  const slide = slides[current];
  const title = locale === "ar" && slide.titleAr ? slide.titleAr : slide.title;
  const subtitle = locale === "ar" && slide.subtitleAr ? slide.subtitleAr : slide.subtitle;
  const ctaLabel = locale === "ar" && slide.ctaLabelAr ? slide.ctaLabelAr : slide.ctaLabel;

  return (
    <section
      className="relative min-h-[85vh] flex items-center overflow-hidden bg-[var(--color-brand-navy)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Hero slideshow"
      aria-roledescription="carousel"
    >
      {/* ── Background images (cross-fade) ── */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          aria-hidden={i !== current}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          {s.imageUrl ? (
            <Image
              src={s.imageUrl}
              alt=""
              fill
              priority={i === 0}
              className="object-cover"
              sizes="100vw"
            />
          ) : null}
          {/* Gradient overlay always present for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#060f22]/90 via-[var(--color-brand-navy)]/75 to-[#0d2a4a]/60" />
        </div>
      ))}

      {/* ── Geometric pattern ── */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A96E' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div
          key={current}  // re-mount triggers CSS animation
          className="max-w-2xl animate-fade-in"
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-brand-gold)]/30 bg-[var(--color-brand-gold)]/10 text-[var(--color-brand-gold)] text-xs font-semibold uppercase tracking-widest mb-6">
            <span>✦</span>
            <span>{locale === "ar" ? "رواق — الأصالة والفخامة" : "Rawaq — Heritage & Luxury"}</span>
            <span>✦</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
            {title.split(" ").map((word, i) => {
              // Gold highlight on specific words
              const goldWords = ["Islamic", "Premium", "Arabic", "Royal", "Ramadan", "إسلامية", "العطور", "رمضان"];
              return goldWords.includes(word) ? (
                <span key={i} className="text-[var(--color-brand-gold)]">{word} </span>
              ) : (
                <span key={i}>{word} </span>
              );
            })}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-lg text-white/75 leading-relaxed mb-8 max-w-lg">
              {subtitle}
            </p>
          )}

          {/* CTA buttons */}
          {ctaLabel && slide.ctaLink && (
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => router.push(slide.ctaLink as any)}
                className="px-8 py-4 bg-[var(--color-brand-gold)] text-[var(--color-brand-navy)] font-bold rounded-[var(--radius-xl)] hover:bg-[var(--color-brand-gold-light)] transition-all hover:shadow-lg hover:shadow-[var(--color-brand-gold)]/20 hover:-translate-y-0.5 text-sm sm:text-base"
              >
                {ctaLabel}
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-8 py-4 bg-transparent border-2 border-white/30 text-white font-semibold rounded-[var(--radius-xl)] hover:border-white/60 hover:bg-white/5 transition-all text-sm sm:text-base"
              >
                {locale === "ar" ? "اكتشف المزيد" : "Explore More"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation arrows ── */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous slide"
            className="absolute start-4 sm:start-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white transition-all hover:scale-110 flex items-center justify-center"
          >
            {locale === "ar" ? "›" : "‹"}
          </button>
          <button
            onClick={goNext}
            aria-label="Next slide"
            className="absolute end-4 sm:end-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white transition-all hover:scale-110 flex items-center justify-center"
          >
            {locale === "ar" ? "‹" : "›"}
          </button>
        </>
      )}

      {/* ── Dot indicators ── */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 inset-x-0 flex justify-center gap-2 z-20" role="tablist" aria-label="Slide indicators">
          {slides.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={i === current}
              aria-label={`Slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? "w-8 h-2.5 bg-[var(--color-brand-gold)]"
                  : "w-2.5 h-2.5 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}

      {/* ── Progress bar ── */}
      {slides.length > 1 && !paused && (
        <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/10 z-20">
          <div
            key={current}
            className="h-full bg-[var(--color-brand-gold)]"
            style={{ animation: "progress-bar 5s linear forwards" }}
          />
        </div>
      )}

      {/* Wave bottom */}
      <div className="absolute bottom-0 inset-x-0 z-10">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 60L1440 60L1440 20C1080 60 720 0 360 30C180 45 60 60 0 60Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
