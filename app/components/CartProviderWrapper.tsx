"use client";

import React, { createContext, useState, ReactNode } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextProps {
  cart: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextProps>({
  cart: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
});

export const CartProviderWrapper = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addItem = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const qty = item.quantity ?? 1;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};