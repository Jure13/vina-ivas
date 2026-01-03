"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";

export default function Footer() {
  const { language } = useLanguage();
  const t = translations[language].footer;

  return (
    <footer className="bg-wine text-white py-6">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row flex-wrap justify-center md:justify-between items-center gap-2 md:gap-0">
        {/* Copyright / Rights */}
        <p className="text-sm">{t.rights}</p>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-4 text-sm mt-2 md:mt-0">
          <Link href="/privacy" className="hover:text-black transition-colors">
            {language === "hr"
              ? "Pravila privatnosti"
              : language === "de"
              ? "Datenschutzbestimmungen"
              : "Privacy Policy"}
          </Link>
          <Link href="/terms" className="hover:text-black transition-colors">
            {language === "hr"
              ? "Uvjeti korištenja"
              : language === "de"
              ? "Nutzungsbedingungen"
              : "Terms of Service"}
          </Link>
          <Link
            href="/admin"
            className="hover:text-black transition-colors font-semibold"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}