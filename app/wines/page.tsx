"use client";

import React, { useState, useEffect } from "react";
import PageHero from "../components/PageHero";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { translations, WineKey } from "../translations";

export default function WinesPage() {
  const { language } = useLanguage();
  const t = translations[language].wines;

  const wineKeys = Object.keys(t) as WineKey[];
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [fade, setFade] = useState(true);

  const handlePrev = () => {
    if (selectedIndex !== null) {
      setFade(false);
      setTimeout(() => {
        setSelectedIndex((selectedIndex - 1 + wineKeys.length) % wineKeys.length);
        setFade(true);
      }, 150);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null) {
      setFade(false);
      setTimeout(() => {
        setSelectedIndex((selectedIndex + 1) % wineKeys.length);
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
        backgroundImage="/slike/poz4.jpg"
        minHeight="40vh"
        maxHeight="60vh"
      />

      <section className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {wineKeys.map((key, i) => (
          <div
            key={i}
            onClick={() => setSelectedIndex(i)}
            className="group border rounded-lg shadow-lg p-4 flex flex-col items-center text-center hover:shadow-xl transition cursor-pointer"
          >
            <div className="overflow-hidden rounded w-full h-60 mb-3 relative">
              <img
                src={t[key].image}
                alt={t[key].name}
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-95"
              />
            </div>
            <h3 className="text-xl font-bold">{t[key].name}</h3>
            <p className="text-gray-600">{t[key].description}</p>
          </div>
        ))}
      </section>

      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center transition-opacity duration-150"
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

            <img
              src={t[wineKeys[selectedIndex]].image}
              alt={t[wineKeys[selectedIndex]].name}
              className={`w-full max-h-[70vh] object-contain mb-4 rounded transition-opacity duration-150 ${
                fade ? "opacity-100" : "opacity-0"
              }`}
            />
            <h3 className="text-2xl font-bold">{t[wineKeys[selectedIndex]].name}</h3>
            <p className="text-gray-700 mt-2">{t[wineKeys[selectedIndex]].description}</p>

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