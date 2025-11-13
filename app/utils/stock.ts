import { translations, WineKey } from "../translations";

const defaultStock: Record<WineKey, number> = {
  wine1: translations.hr.wines.wine1.stock,
  wine2: translations.hr.wines.wine2.stock,
  wine3: translations.hr.wines.wine3.stock,
  wine4: translations.hr.wines.wine4.stock,
  wine5: translations.hr.wines.wine5.stock,
};

export function getStock(): Record<WineKey, number> {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("wineStock");
    if (saved) return JSON.parse(saved);
  }
  return { ...defaultStock };
}

export function setStock(newStock: Record<WineKey, number>) {
  if (typeof window !== "undefined") {
    localStorage.setItem("wineStock", JSON.stringify(newStock));
  }
}