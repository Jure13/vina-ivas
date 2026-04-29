"use client";

import React, { useEffect, useCallback } from "react";
import Image from "next/image";

interface LightboxProps {
  items: string[];
  currentIndex: number;
  onClose: () => void;
  setIndex: (index: number) => void;
}

export default function Lightbox({ items, currentIndex, onClose, setIndex }: LightboxProps) {
  const prev = useCallback(() => setIndex((currentIndex - 1 + items.length) % items.length), [currentIndex, items.length, setIndex]);
  const next = useCallback(() => setIndex((currentIndex + 1) % items.length), [currentIndex, items.length, setIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next, onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="relative max-h-[90vh] max-w-[90vw] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {items[currentIndex].endsWith(".mp4") ? (
          <video
            src={items[currentIndex]}
            controls
            autoPlay
            className="max-h-[90vh] max-w-[90vw]"
          />
        ) : (
          <div className="relative w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh]">
            <Image 
              src={items[currentIndex]} 
              alt="" 
              fill
              className="object-contain" 
              sizes="90vw"
            />
          </div>
        )}

        {/* Navigation */}
        <button
          onClick={prev}
          className="absolute top-1/2 left-0 -translate-y-1/2 text-white text-3xl px-4"
        >
          ‹
        </button>
        <button
          onClick={next}
          className="absolute top-1/2 right-0 -translate-y-1/2 text-white text-3xl px-4"
        >
          ›
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white text-lg leading-none hover:bg-black/80 transition"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}