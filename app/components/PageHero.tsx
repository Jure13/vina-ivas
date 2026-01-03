"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";

export interface PageHeroProps {
  titleKey?: string;       // e.g., "hero.title"
  subtitleKey?: string;    // e.g., "hero.subtitle"
  backgroundImage?: string;
  minHeight?: string;
  maxHeight?: string;
  buttonKey?: string;      // e.g., "hero.button"
  buttonLink?: string;
}

export default function PageHero({
  titleKey,
  subtitleKey,
  backgroundImage,
  minHeight = "60vh",
  maxHeight = "80vh",
  buttonKey,
  buttonLink,
}: PageHeroProps) {
  const { language } = useLanguage();
  const t = translations[language];

  const [titleVisible, setTitleVisible] = useState(false);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);

  useEffect(() => {
    const titleTimer = setTimeout(() => setTitleVisible(true), 200);
    const subtitleTimer = setTimeout(() => setSubtitleVisible(true), 600);
    const buttonTimer = setTimeout(() => setButtonVisible(true), 1000);

    return () => {
      clearTimeout(titleTimer);
      clearTimeout(subtitleTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  const getText = (key?: string) => {
    if (!key) return "";
    const parts = key.split(".");
    let value: any = t;
    for (const part of parts) {
      value = value?.[part];
      if (!value) break;
    }
    return value ?? key;
  };

  return (
    <section
      className="relative flex items-center justify-center text-center text-white"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight,
        maxHeight,
      }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 px-4">
        {titleKey && (
          <h1
            className={`text-4xl md:text-6xl font-bold mb-4 transition-opacity duration-700 ${
              titleVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {getText(titleKey)}
          </h1>
        )}

        {subtitleKey && (
          <p
            className={`text-lg md:text-2xl mb-6 max-w-2xl mx-auto transition-opacity duration-700 ${
              subtitleVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {getText(subtitleKey)}
          </p>
        )}

        {buttonKey && buttonLink && (
          <Link
            href={buttonLink}
            className={`inline-block bg-wine text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-wine/90 transition-opacity duration-700 ${
              buttonVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {getText(buttonKey)}
          </Link>
        )}
      </div>
    </section>
  );
}