"use client";

import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import CartSidebar from "./components/CartSidebar";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CartProvider>
        {children}
        <CartSidebar />
      </CartProvider>
    </LanguageProvider>
  );
}