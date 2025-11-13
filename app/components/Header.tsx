"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { translations, Language } from "../translations";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { toggleCart } = useCart();
  const { language, setLanguage } = useLanguage();
  const t = translations[language].nav;

  return (
    <header className="bg-wine text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Left: Logo + Language buttons */}
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Image src="/slike/logo.png" alt="Vina Ivas" width={120} height={40} />
          </Link>
          <div className="hidden md:flex items-center space-x-2">
            {(["hr", "en", "de"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 rounded hover:bg-white/20 transition ${
                  language === lang ? "bg-white/30 font-bold" : ""
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Nav + Cart */}
        <nav className="hidden md:flex items-center space-x-6">
          {Object.entries(t).map(([key, label]) => (
            <Link
              key={key}
              href={`/${key === "home" ? "" : key}`}
              className="relative transition-colors hover:text-gray-200"
            >
              <span className="after:block after:h-[2px] after:w-0 after:bg-white after:transition-all hover:after:w-full">
                {label}
              </span>
            </Link>
          ))}
          <button onClick={toggleCart}>
            <ShoppingCart size={24} />
          </button>
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center space-x-2">
          <button onClick={toggleCart}>
            <ShoppingCart size={24} />
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-wine/95 text-white flex flex-col items-center py-4 space-y-3">
          {Object.entries(t).map(([key, label]) => (
            <Link
              key={key}
              href={`/${key === "home" ? "" : key}`}
              className="hover:text-gray-200 text-lg transition"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="flex items-center space-x-2 mt-2">
            {(["hr", "en", "de"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  setMenuOpen(false);
                }}
                className={`px-2 py-1 rounded hover:bg-white/20 transition ${
                  language === lang ? "bg-white/30 font-bold" : ""
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}