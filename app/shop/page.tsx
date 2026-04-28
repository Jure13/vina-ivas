"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import PageHero from "../components/PageHero";
import { useLanguage } from "../context/LanguageContext";
import { translations, WineKey } from "../translations";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

export default function ShopPage() {
  const { language } = useLanguage();
  const wines = translations[language].wines;
  const { addToCart, stock } = useCart();

  const [quantities, setQuantities] = useState<Record<WineKey, number>>(
    Object.keys(wines).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}) as Record<WineKey, number>
  );

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
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
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg shadow-lg p-4 animate-pulse">
              <div className="w-full h-60 bg-gray-200 rounded mb-3" />
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full mb-4" />
            </div>
          ))}
        </section>
      </>
    );
  }

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

  const handleAdd = async (id: WineKey, wine: (typeof wines)[WineKey]) => {
    const quantity = quantities[id] ?? 0;

    if (quantity === 0) {
      toast.error("Please select a quantity");
      return;
    }

    if (quantity > (stock[id] ?? 0)) {
      toast.error(`Only ${stock[id]} bottles available`);
      return;
    }

    setLoading(true);

    try {
      await addToCart({
        id,
        name: wine.name,
        price: wine.price ?? 100,
        image: wine.image,
        quantity,
      });
      setQuantities((prev) => ({ ...prev, [id]: 0 }));
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setLoading(false);
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
        {Object.entries(wines).map(([key, wine], index) => {
          const wineKey = key as WineKey;
          const isOutOfStock = (stock[wineKey] ?? 0) === 0;

          return (
            <div
              key={wineKey}
              className={`border rounded-lg shadow-lg p-4 flex flex-col items-center text-center hover:shadow-xl transition ${
                isOutOfStock ? "opacity-60" : ""
              }`}
            >
              <Image
                src={wine.image}
                alt={wine.name}
                width={400}
                height={240}
                className="w-full h-60 object-cover mb-3 rounded"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={index < 3}
                loading={index < 3 ? undefined : "lazy"}
              />
              <h3 className="text-xl font-bold">{wine.name}</h3>
              <p className="text-gray-600 mb-2">{wine.description}</p>

              <p className={`text-sm mb-2 ${isOutOfStock ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                {isOutOfStock
                  ? translations[language].shop.outOfStock
                  : `${stock[wineKey] ?? 0} ${translations[language].shop.bottlesAvailable}`}
              </p>

              <div className="flex items-center gap-2 mt-auto mb-2">
                <button
                  onClick={() => decrement(wineKey)}
                  disabled={isOutOfStock || loading}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  –
                </button>
                <span className="w-8 text-center">{quantities[wineKey]}</span>
                <button
                  onClick={() => increment(wineKey)}
                  disabled={isOutOfStock || loading}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
                <button
                  onClick={() => handleAdd(wineKey, wine)}
                  disabled={isOutOfStock || loading || quantities[wineKey] === 0}
                  className="bg-wine text-white px-4 py-2 rounded hover:bg-wine/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "..." : translations[language].shop.addToCart}
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
