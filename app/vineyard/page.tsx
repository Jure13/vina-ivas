"use client";

import React, { useState, useEffect } from "react";
import PageHero from "../components/PageHero";
import { ChevronLeft, ChevronRight, X, Play } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";

const vineyardItems = [
  { type: "image", src: "/slike/vin1.jpg", key: 0 },
  { type: "image", src: "/slike/vin2.jpg", key: 1 },
  { type: "image", src: "/slike/collage1.png", key: 2 },
  { type: "image", src: "/slike/collage2.png", key: 3 },
  { type: "image", src: "/slike/vin10.jpg", key: 4 },
  { type: "video", src: "/slike/vinvid.mp4", key: 5 },
];

export default function VineyardPage() {
  const { language } = useLanguage();
  const t = translations[language].vineyardItems;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [fade, setFade] = useState(true);

  const handlePrev = () => {
    if (selectedIndex !== null) {
      setFade(false);
      setTimeout(() => {
        setSelectedIndex((selectedIndex - 1 + vineyardItems.length) % vineyardItems.length);
        setFade(true);
      }, 150);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null) {
      setFade(false);
      setTimeout(() => {
        setSelectedIndex((selectedIndex + 1) % vineyardItems.length);
        setFade(true);
      }, 150);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex !== null) {
        if (e.key === "Escape") setSelectedIndex(null);
        else if (e.key === "ArrowLeft") handlePrev();
        else if (e.key === "ArrowRight") handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex]);

  return (
    <>
      <PageHero
        titleKey="hero.title"
        subtitleKey="hero.subtitle"
        backgroundImage="/slike/poz3.jpg"
        minHeight="40vh"
        maxHeight="60vh"
      />

      <section className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {vineyardItems.map((item, i) => (
          <div
            key={i}
            onClick={() => setSelectedIndex(i)}
            className="group border rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition transform hover:scale-95 text-center relative"
          >
            <div className="w-full h-60 overflow-hidden mb-3 rounded relative">
              {item.type === "image" ? (
                <img
                  src={item.src}
                  alt={t[item.key].title}
                  className="w-full h-full object-cover transition-transform duration-300"
                />
              ) : (
                <>
                  <video src={item.src} className="w-full h-full object-cover" muted />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play size={48} className="text-white opacity-80" />
                  </div>
                </>
              )}
            </div>
            <h3 className="text-xl font-bold">{t[item.key].title}</h3>
            <p className="text-gray-600">{t[item.key].description}</p>
          </div>
        ))}
      </section>

      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center transition-opacity duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(null);
              }}
              className="absolute top-3 right-3 text-gray-600 hover:text-black"
            >
              <X size={28} />
            </button>

            {vineyardItems[selectedIndex].type === "image" ? (
              <img
                src={vineyardItems[selectedIndex].src}
                alt={t[vineyardItems[selectedIndex].key].title}
                className={`w-full max-h-[70vh] object-contain mb-4 rounded transition-opacity duration-150 ${
                  fade ? "opacity-100" : "opacity-0"
                }`}
              />
            ) : (
              <video
                src={vineyardItems[selectedIndex].src}
                controls
                autoPlay
                className="w-full max-h-[70vh] mb-4 rounded"
              />
            )}

            <h3 className="text-2xl font-bold">{t[vineyardItems[selectedIndex].key].title}</h3>
            <p className="text-gray-700 mt-2">{t[vineyardItems[selectedIndex].key].description}</p>

            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
              <button onClick={handlePrev} className="bg-white rounded-full shadow p-2 hover:bg-gray-100">
                <ChevronLeft size={28} />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              <button onClick={handleNext} className="bg-white rounded-full shadow p-2 hover:bg-gray-100">
                <ChevronRight size={28} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}