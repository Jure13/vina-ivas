"use client";

import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";

export default function TermsPage() {
  const { language } = useLanguage();
  const t = translations[language].termsPage;

  return (
    <main className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-3xl font-bold">{t.title}</h1>

      {t.paragraphs.map((p, i) => (
        <p key={i} className="text-gray-700 leading-relaxed">
          {p}
        </p>
      ))}
    </main>
  );
}
