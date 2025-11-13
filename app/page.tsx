"use client";

import React from "react";
import PageHero from "./components/PageHero";

export default function HomePage() {
  return (
    <div className="flex flex-col flex-grow">
      <PageHero
        titleKey="hero.title"
        subtitleKey="hero.subtitle"
        backgroundImage="/slike/poz1.jpeg"
        minHeight="calc(100vh - 64px)"
        maxHeight="calc(100vh - 64px)"
      />
    </div>
  );
}