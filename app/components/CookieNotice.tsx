"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { translations } from "@/app/translations";
import { useLanguage } from "../context/LanguageContext";

export default function CookieNotice() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language].cookieNotice;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookieConsent", "declined");
    window.close(); // may fail
    window.location.href = "https://www.google.com"; // fallback
  };

  const goToTerms = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setVisible(false);
    router.push("/terms");
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-4xl w-[95%] bg-white border border-gray-300 shadow-lg rounded-lg p-4 space-y-4">
      <p className="text-sm text-gray-700">{t.text}</p>

      <div className="flex flex-wrap gap-3 justify-end">
        <button
          onClick={declineCookies}
          className="px-4 py-2 text-sm border rounded-md hover:bg-gray-100"
        >
          {t.decline}
        </button>

        <button
          onClick={goToTerms}
          className="px-4 py-2 text-sm border rounded-md hover:bg-gray-100"
        >
          {t.terms}
        </button>

        <button
          onClick={acceptCookies}
          className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800"
        >
          {t.accept}
        </button>
      </div>
    </div>
  );
}