"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import { translations, WineKey } from "../translations";

type Stock = Partial<Record<WineKey, number>>;

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  date?: string;
  orderId: string;
};

export default function AdminPage() {
  const { language } = useLanguage();

  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [stock, setStock] = useState<Stock>({});
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  /** ------------------ AUTH ------------------ */
  const handleLogin = async () => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
        setToken(data.token);
        localStorage.setItem("adminToken", data.token);
        loadStock(data.token);
      } else {
        alert("Wrong password");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed");
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setPasswordInput("");
    setToken(null);
    setStock({});
    setOrders([]);
    localStorage.removeItem("adminToken");
  };

  /** ------------------ STOCK ------------------ */
  const loadStock = useCallback(async (authToken?: string) => {
    const tkn = authToken || token;
    if (!tkn) return;
    try {
      const res = await fetch("/api/stock", {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      if (res.ok) {
        const data: Stock = await res.json();
        setStock(data);
      }
    } catch (err) {
      console.error("Failed to load stock:", err);
    }
  }, [token]);

  const updateStockValue = (wineKey: WineKey, newValue: number) => {
    setStock((prev) => ({ ...prev, [wineKey]: newValue }));
  };

  const handleSave = async () => {
    if (!token) {
      alert("No authentication token");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/update-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stock }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Stock updated successfully!");
        await loadStock();
      } else {
        console.error("Update failed:", data);
        alert("Error updating stock: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save stock changes");
    } finally {
      setLoading(false);
    }
  };

  /** ------------------ ORDERS ------------------ */
  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const flattened: OrderItem[] = data.flatMap((order: any) => {
          const items = JSON.parse(order.items);
          return items.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            date: order.date,
            orderId: order.id,
          }));
        });
        setOrders(flattened);
      } else {
        console.error("Failed to fetch orders:", res.status);
        alert("Failed to fetch orders");
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
    }
  };

  const downloadOrdersCSV = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/orders", {
        headers: {
          Accept: "text/csv",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "orders.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Failed to download CSV:", res.status);
        alert("Failed to download CSV");
      }
    } catch (err) {
      console.error("CSV download error:", err);
    }
  };

  /** ------------------ EFFECTS ------------------ */
  useEffect(() => {
    const savedToken = localStorage.getItem("adminToken");
    if (savedToken) {
      setToken(savedToken);
      setAuthenticated(true);
      // Load stock with saved token directly to avoid dependency loop
      loadStock(savedToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ------------------ RENDER ------------------ */
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-6 rounded shadow-md w-80">
          <h2 className="text-lg font-semibold mb-4">Admin Login</h2>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="border px-3 py-2 w-full rounded mb-4"
            placeholder="Enter password"
          />
          <button
            onClick={handleLogin}
            className="bg-wine text-white px-4 py-2 rounded w-full hover:bg-wine/90"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
        >
          Logout
        </button>
      </div>

      {/* Stock Management */}
      <h2 className="text-xl font-semibold mb-4">Stock Management</h2>
      {Object.keys(translations[language].wines).map((key) => {
        const wineKey = key as WineKey;
        const wine = translations[language].wines[wineKey];
        return (
          <div
            key={wineKey}
            className="flex items-center justify-between mb-4 bg-gray-50 p-4 rounded shadow"
          >
            <div>
              <p className="font-semibold">{wine.name}</p>
              <p className="text-sm text-gray-600">{wine.description}</p>
            </div>
            <input
              type="number"
              min={0}
              value={stock[wineKey] ?? 0}
              onChange={(e) =>
                updateStockValue(wineKey, parseInt(e.target.value) || 0)
              }
              className="w-24 border px-2 py-1 rounded text-center"
            />
          </div>
        );
      })}
      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-4 bg-wine text-white px-6 py-2 rounded hover:bg-wine/90 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Stock"}
      </button>

      {/* Orders Section */}
      <h2 className="text-xl font-semibold mt-10 mb-4">Orders</h2>
      <div className="flex gap-4 mb-4">
        <button
          onClick={fetchOrders}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Refresh Orders
        </button>
        <button
          onClick={downloadOrdersCSV}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Download CSV
        </button>
      </div>

      {orders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-200 text-center">
                <th className="border px-3 py-2">Order ID</th>
                <th className="border px-3 py-2">Item ID</th>
                <th className="border px-3 py-2">Name</th>
                <th className="border px-3 py-2">Price</th>
                <th className="border px-3 py-2">Quantity</th>
                <th className="border px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, idx) => (
                <tr key={idx} className="text-center">
                  <td className="border px-3 py-2">{o.orderId}</td>
                  <td className="border px-3 py-2">{o.id}</td>
                  <td className="border px-3 py-2">{o.name}</td>
                  <td className="border px-3 py-2">€{o.price}</td>
                  <td className="border px-3 py-2">{o.quantity}</td>
                  <td className="border px-3 py-2">{o.date ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No orders found.</p>
      )}
    </div>
  );
}