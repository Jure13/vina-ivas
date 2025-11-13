"use client";

import React, { useState, useEffect } from "react";
import PageHero from "../components/PageHero";
import { useLanguage } from "../context/LanguageContext";
import { translations, WineKey } from "../translations";
import { useCart } from "../context/CartContext";

export default function ShopPage() {
  const { language } = useLanguage();
  const wines = translations[language].wines;
  const { addToCart, stock } = useCart();

  const [quantities, setQuantities] = useState<Record<WineKey, number>>({
    wine1: 0,
    wine2: 0,
    wine3: 0,
    wine4: 0,
    wine5: 0,
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // prevent SSR hydration errors

  const increment = (id: WineKey) =>
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.min((prev[id] ?? 0) + 1, stock[id] ?? 0),
    }));

  const decrement = (id: WineKey) =>
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max((prev[id] ?? 0) - 1, 0),
    }));

  const handleAdd = (id: WineKey, wine: typeof wines[WineKey]) => {
    const quantity = quantities[id] ?? 0;
    if (quantity > 0 && quantity <= (stock[id] ?? 0)) {
      addToCart({
        id,
        name: wine.name,
        price: wine.price ?? 100,
        image: wine.image,
        quantity,
      });
      setQuantities((prev) => ({ ...prev, [id]: 0 }));
    }
  };

  return (
    <>
      <PageHero
        titleKey="nav.shop"
        subtitleKey=""
        backgroundImage="/slike/poz2.png"
        minHeight="40vh"
        maxHeight="60vh"
      />

      <section className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Object.entries(wines).map(([key, wine]) => {
          const wineKey = key as WineKey;
          return (
            <div
              key={wineKey}
              className="border rounded-lg shadow-lg p-4 flex flex-col items-center text-center hover:shadow-xl transition"
            >
              <img
                src={wine.image}
                alt={wine.name}
                className="w-full h-60 object-cover mb-3 rounded"
              />
              <h3 className="text-xl font-bold">{wine.name}</h3>
              <p className="text-gray-600 mb-2">{wine.description}</p>

              <p className="text-sm text-gray-500 mb-2">
                {stock[wineKey] ?? 0} bottles available
              </p>

              <div className="flex items-center gap-2 mt-auto mb-2">
                <button
                  onClick={() => decrement(wineKey)}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                >
                  –
                </button>
                <span className="w-8 text-center">{quantities[wineKey]}</span>
                <button
                  onClick={() => increment(wineKey)}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                >
                  +
                </button>
                <button
                  onClick={() => handleAdd(wineKey, wine)}
                  className="bg-wine text-white px-4 py-2 rounded hover:bg-wine/90 transition"
                >
                  {translations[language].shop.addToCart}
                </button>
              </div>

              <p className="text-lg font-semibold">{wine.price ?? 100} €</p>
            </div>
          );
        })}
      </section>
    </>
  );
}