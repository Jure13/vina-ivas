"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from "react";
import toast from "react-hot-toast";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isOpen: boolean;
  toggleCart: () => void;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  stock: Record<string, number>;
  updateStock: (id: string, newStock: number) => Promise<void>;
  refreshStock: () => Promise<void>;
  cartTotal: number;
  itemCount: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [stock, setStock] = useState<Record<string, number>>({});

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const refreshStock = async () => {
    try {
      const res = await fetch("/api/stock");
      const data = await res.json();
      setStock(data);
    } catch (err) {
      console.error("Failed to load stock:", err);
      toast.error("Failed to load stock information");
    }
  };

  useEffect(() => {
    refreshStock();
  }, []);

  const addToCart = async (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const quantity = item.quantity ?? 1;

    if ((stock[item.id] ?? 0) < quantity) {
      toast.error(`Not enough stock for ${item.name}`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });

    setIsOpen(true);
    toast.success(`${item.name} added to cart!`);

    await fetch("/api/admin/update-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: { [item.id]: (stock[item.id] ?? 0) - quantity } }),
    });

    await refreshStock();
  };

  const removeFromCart = async (id: string) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    await fetch("/api/admin/update-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: { [id]: (stock[id] ?? 0) + item.quantity } }),
    });

    setCart((prev) => prev.filter((i) => i.id !== id));
    toast.success(`${item.name} removed from cart`);
    await refreshStock();
  };

  const clearCart = async () => {
    const updatedStock: Record<string, number> = {};
    cart.forEach((i) => {
      updatedStock[i.id] = (stock[i.id] ?? 0) + i.quantity;
    });

    await fetch("/api/admin/update-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: updatedStock }),
    });

    setCart([]);
    toast.success("Cart cleared");
    await refreshStock();
  };

  const updateStock = async (id: string, newStock: number) => {
    await fetch("/api/admin/update-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: { [id]: newStock } }),
    });
    await refreshStock();
  };

  const toggleCart = () => setIsOpen(!isOpen);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        isOpen,
        toggleCart,
        setIsOpen,
        stock,
        updateStock,
        refreshStock,
        cartTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
