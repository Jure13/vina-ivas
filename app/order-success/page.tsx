"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";
import PageHero from "../components/PageHero";

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  const orderId = searchParams.get("orderId");
  const t = translations[language].checkout;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if no order ID
  useEffect(() => {
    if (mounted && !orderId) {
      router.push("/shop");
    }
  }, [mounted, orderId, router]);

  if (!mounted || !orderId) {
    return null;
  }

  return (
    <>
      <PageHero
        titleKey="checkout.title"
        subtitleKey=""
        backgroundImage="/slike/poz2.png"
        minHeight="40vh"
        maxHeight="60vh"
      />
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-8">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-green-800 mb-4">{t.thankYou}</h1>
          <p className="text-lg text-green-700 mb-4">{t.orderConfirmed}</p>
          <p className="text-md text-green-600">
            {t.orderNumber}: <strong>#{orderId}</strong>
          </p>
          <p className="text-sm text-green-600 mt-2">
            {t.orderSuccessEmail}
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => router.push("/shop")}
            className="bg-wine text-white px-8 py-3 rounded-lg hover:bg-wine/90 transition text-lg"
          >
            {t.backToShop}
          </button>
          
          <div className="text-sm text-gray-600">
            <p>{t.questions}</p>
            <button
              onClick={() => router.push("/contact")}
              className="text-wine hover:underline"
            >
              {t.kontaktirajte}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}