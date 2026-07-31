"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";

interface ProductLightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  isRtl: boolean;
}

export function ProductLightbox({ images, initialIndex, onClose, isRtl }: ProductLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const goNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIndex((prev) => (isRtl ? (prev - 1 + images.length) % images.length : (prev + 1) % images.length));
  };

  const goPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIndex((prev) => (isRtl ? (prev + 1) % images.length : (prev - 1 + images.length) % images.length));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") isRtl ? goPrev() : goNext();
      else if (e.key === "ArrowLeft") isRtl ? goNext() : goPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRtl, images.length, onClose]); // eslint-disable-line

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prev) => Math.min(Math.max(1, prev - e.deltaY * 0.01), 4));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white" onClick={onClose} style={{ touchAction: 'none' }}>
      <div className="absolute top-4 end-4 z-[60]">
        <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {images.length > 1 && (
        <>
          <button 
            onClick={goPrev} 
            className="absolute start-4 top-1/2 -translate-y-1/2 z-[60] p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
          >
            <span className="text-2xl leading-none">{isRtl ? "›" : "‹"}</span>
          </button>
          <button 
            onClick={goNext} 
            className="absolute end-4 top-1/2 -translate-y-1/2 z-[60] p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
          >
            <span className="text-2xl leading-none">{isRtl ? "‹" : "›"}</span>
          </button>
        </>
      )}

      <div className="flex-1 flex items-center justify-center overflow-hidden relative" onClick={onClose}>
        <div 
          className="relative w-full h-full max-h-[85vh] max-w-5xl mx-auto"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onClick={(e) => { e.stopPropagation(); if (scale === 1) handleDoubleClick(e); }}
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
        >
          <div 
            className="w-full h-full transition-transform duration-200" 
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center'
            }}
          >
            <Image
              src={images[index]}
              alt={`Product image ${index + 1}`}
              fill
              className="object-contain select-none"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      </div>

      {images.length > 1 && (
        <div className="h-24 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-2 overflow-x-auto px-4 py-2 shrink-0" onClick={e => e.stopPropagation()}>
          {images.map((img, i) => (
            <button
              key={img + i}
              onClick={() => { setScale(1); setPosition({x:0,y:0}); setIndex(i); }}
              className={`relative w-16 h-16 shrink-0 rounded-md overflow-hidden border-2 transition-all ${index === i ? 'border-white' : 'border-transparent opacity-50 hover:opacity-100'}`}
            >
              <Image src={img} alt={`Thumbnail ${i+1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
