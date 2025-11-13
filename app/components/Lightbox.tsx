"use client";

import React, { useEffect } from "react";

interface LightboxProps {
  items: string[];
  currentIndex: number;
  onClose: () => void;
  setIndex: (index: number) => void;
}

export default function Lightbox({ items, currentIndex, onClose, setIndex }: LightboxProps) {
  const prev = () => setIndex((currentIndex - 1 + items.length) % items.length);
  const next = () => setIndex((currentIndex + 1) % items.length);

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        {items[currentIndex].endsWith(".mp4") ? (
          <video
            src={items[currentIndex]}
            controls
            autoPlay
            className="max-h-[90vh] max-w-[90vw]"
          />
        ) : (
          <img src={items[currentIndex]} className="max-h-[90vh] max-w-[90vw]" />
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
          className="absolute top-2 right-2 text-white text-2xl font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
}