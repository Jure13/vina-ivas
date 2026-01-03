"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import { X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";
import { useRouter } from "next/navigation";

const CartSidebar: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language].cart;
  const router = useRouter();

  const { cart, removeFromCart, clearCart, isOpen, toggleCart, setIsOpen } = useCart();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const hasItems = cart.length > 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen]);

  const handleCheckout = () => {
    if (hasItems) {
      setIsOpen(false);
      router.push("/checkout");
    }
  };

  return (
    <div
      ref={sidebarRef}
      className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">{t.title}</h2>
        <button onClick={toggleCart}>
          <X size={24} />
        </button>
      </div>

      <div className="p-4 overflow-y-auto h-[calc(100%-160px)] flex flex-col">
        <div className="flex-1 space-y-4">
          {cart.length === 0 && <p className="text-gray-500 text-center">{t.empty}</p>}
          {cart.map((item) => (
            <div key={item.id} className="flex items-center justify-between border-b pb-2">
              <Image src={item.image} alt={item.name} width={48} height={48} className="h-12 w-12 object-cover rounded" />
              <div className="flex-1 ml-2">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.quantity} × {item.price} €
                </p>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-red-500 hover:underline"
              >
                {t.remove}
              </button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <>
            <p className="text-xs text-gray-500 mb-2">{t.deliveryNote}</p>
            <button
              onClick={clearCart}
              className="mt-1 w-full bg-gray-200 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              {t.clear}
            </button>
          </>
        )}
      </div>

      <div className="p-4 border-t">
        <p className="font-bold text-lg mb-2">
          {t.total}: {total.toFixed(2)} €{t.plusDelivery}
        </p>
        <button
          onClick={handleCheckout}
          disabled={!hasItems}
          className={`w-full py-2 rounded-lg transition ${
            hasItems
              ? "bg-wine text-white hover:bg-wine/80 cursor-pointer"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {t.checkout}
        </button>
      </div>
    </div>
  );
};

export default CartSidebar;