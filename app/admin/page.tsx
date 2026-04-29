"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedValue(value), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  return debouncedValue;
}
import { useLanguage } from "../context/LanguageContext";
import { translations, WineKey } from "../translations";
import toast from "react-hot-toast";

type Stock = Partial<Record<WineKey, number>>;

type OrderRow = {
  id: number;
  date: string;
  total: number;
  items: string;
  customer_email: string | null;
  customer_name: string | null;
  payment_status: string | null;
  payment_intent_id: string | null;
};

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  date?: string;
  orderId: number;
  customerEmail: string | null;
  customerName: string | null;
  paymentStatus: string | null;
  paymentIntentId: string | null;
};

export default function AdminPage() {
  const { language } = useLanguage();

  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [stock, setStock] = useState<Stock>({});
  const debouncedStock = useDebounce(stock, 500);
  void debouncedStock; // available for future auto-save use
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string>("");

  /** ------------------ AUTH ------------------ */
  const handleLogin = async () => {
    setLoginError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        setAuthenticated(true);
        setToken(data.token);
        sessionStorage.setItem("adminToken", data.token);
        loadStock(data.token);
      } else {
        setLoginError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setPasswordInput("");
    setToken(null);
    setStock({});
    setOrders([]);
    sessionStorage.removeItem("adminToken");
  };

  /** ------------------ STOCK ------------------ */
  const loadStock = useCallback(async (authToken?: string) => {
    const tkn = authToken || token;
    if (!tkn) return;

    try {
      const res = await fetch("/api/stock", {
        headers: { Authorization: `Bearer ${tkn}` },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

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
      toast.error("No authentication token");
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

      if (res.status === 401) {
        handleLogout();
        toast.error("Session expired. Please login again.");
        return;
      }

      const data = await res.json();

      if (data.success) {
        toast.success("Stock updated successfully! ✓");
        await loadStock();
      } else {
        console.error("Update failed:", data);
        toast.error("Error: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save stock changes");
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

      if (res.status === 401) {
        handleLogout();
        toast.error("Session expired. Please login again.");
        return;
      }

      if (res.ok) {
        const data: OrderRow[] = await res.json();
        const flattened: OrderItem[] = data.flatMap((order) => {
          const items: { id: string; name: string; price: number; quantity: number }[] =
            JSON.parse(order.items);
          return items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            date: order.date,
            orderId: order.id,
            customerEmail: order.customer_email,
            customerName: order.customer_name,
            paymentStatus: order.payment_status,
            paymentIntentId: order.payment_intent_id,
          }));
        });
        setOrders(flattened);
        toast.success(`Loaded ${data.length} orders`);
      } else {
        console.error("Failed to fetch orders:", res.status);
        toast.error("Failed to fetch orders");
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
      toast.error("Error loading orders");
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

      if (res.status === 401) {
        handleLogout();
        toast.error("Session expired. Please login again.");
        return;
      }

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("CSV downloaded successfully! ✓");
      } else {
        console.error("Failed to download CSV:", res.status);
        toast.error("Failed to download CSV");
      }
    } catch (err) {
      console.error("CSV download error:", err);
      toast.error("Error downloading CSV");
    }
  };

  const clearOrders = async () => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete all orders? This cannot be undone.")) return;

    try {
      const res = await fetch("/api/orders", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        handleLogout();
        toast.error("Session expired. Please login again.");
        return;
      }

      const data = await res.json();
      if (data.success) {
        setOrders([]);
        toast.success(`Deleted ${data.deleted} order(s)`);
      } else {
        toast.error("Failed to clear orders");
      }
    } catch (err) {
      console.error("Clear orders error:", err);
      toast.error("Error clearing orders");
    }
  };

  /** ------------------ EFFECTS ------------------ */
  useEffect(() => {
    const savedToken = sessionStorage.getItem("adminToken");
    if (savedToken) {
      setToken(savedToken);
      setAuthenticated(true);
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
          
          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {loginError}
            </div>
          )}

          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="border px-3 py-2 w-full rounded mb-4"
            placeholder="Enter password"
            disabled={loading}
          />
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-wine text-white px-4 py-2 rounded w-full hover:bg-wine/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
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

      {/* Low Stock Warning */}
      {Object.values(stock).some((qty) => qty < 5) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Low Stock Warning</h3>
              <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                {Object.entries(stock)
                  .filter(([, qty]) => qty < 5)
                  .map(([id, qty]) => {
                    const wine = translations[language].wines[id as WineKey];
                    return (
                      <li key={id}>
                        <strong>{wine?.name ?? id}</strong>: {qty} bottles remaining
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>
        </div>
      )}

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
        <button
          onClick={clearOrders}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Clear Orders
        </button>
      </div>

      {orders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-200 text-center">
                <th className="border px-3 py-2">Order ID</th>
                <th className="border px-3 py-2">Date</th>
                <th className="border px-3 py-2">Customer</th>
                <th className="border px-3 py-2">Email</th>
                <th className="border px-3 py-2">Item</th>
                <th className="border px-3 py-2">Qty</th>
                <th className="border px-3 py-2">Price</th>
                <th className="border px-3 py-2">Payment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, idx) => {
                const statusColor =
                  o.paymentStatus === "paid"
                    ? "bg-green-100 text-green-800"
                    : o.paymentStatus === "failed"
                    ? "bg-red-100 text-red-800"
                    : o.paymentStatus === "cod"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-yellow-100 text-yellow-800";
                return (
                  <tr key={idx} className="text-center">
                    <td className="border px-3 py-2 font-mono">#{o.orderId}</td>
                    <td className="border px-3 py-2 whitespace-nowrap">
                      {o.date ? new Date(o.date).toLocaleString("hr-HR") : "-"}
                    </td>
                    <td className="border px-3 py-2">{o.customerName ?? "-"}</td>
                    <td className="border px-3 py-2">{o.customerEmail ?? "-"}</td>
                    <td className="border px-3 py-2 text-left">{o.name}</td>
                    <td className="border px-3 py-2">{o.quantity}</td>
                    <td className="border px-3 py-2">€{o.price.toFixed(2)}</td>
                    <td className="border px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>
                        {o.paymentStatus ?? "pending"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No orders found.</p>
      )}
    </div>
  );
}