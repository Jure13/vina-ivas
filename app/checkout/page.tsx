"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";
import { useRouter } from "next/navigation";
import PageHero from "../components/PageHero";
import { useCheckout } from "../context/CheckoutContext";

type Country = {
  code: string;
  name: string;
  deliveryFee: number;
  deliveryCalculator: (subtotal: number) => number;
};

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { language } = useLanguage();
  const router = useRouter();
  const { form, setForm, paymentMethod, setPaymentMethod } = useCheckout();

  const t = translations[language].checkout;
  const countries = translations[language].countries;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  // Prevent SSR mismatch
  useEffect(() => setMounted(true), []);

  // Redirect if cart empty
  useEffect(() => {
    if (mounted && cart.length === 0) router.push("/shop");
  }, [cart, mounted, router]);

  if (!mounted) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selectedCountry: Country | undefined = countries.find((c) => c.code === form.country);
  const deliveryFee = selectedCountry ? selectedCountry.deliveryCalculator(subtotal) : 0;
  const total = subtotal + deliveryFee;

 const getDeliveryDisplay = () => {
    if (!form.country || !selectedCountry) return t.deliveryDepends;
    if (deliveryFee === 0) return t.deliveryFree;
    return t.deliveryPaid.replace("{amount}", deliveryFee.toFixed(2));
  };

  const validators: Partial<Record<keyof typeof form, (v: string) => string | null>> = {
    firstName: (v) => (!v.trim() ? t.required : null),
    lastName: (v) => (!v.trim() ? t.required : null),
    email: (v) =>
      !v.trim() ? t.required : !/\S+@\S+\.\S+/.test(v) ? t.invalidEmail : null,
    phone: (v) => (!v.trim() ? t.required : null),
    address: (v) => (!v.trim() ? t.required : null),
    city: (v) => (!v.trim() ? t.required : null),
    postalCode: (v) => (!v.trim() ? t.required : null),
    country: (v) => (!v.trim() ? t.required : null),
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    (Object.keys(validators) as (keyof typeof form)[]).forEach((field) => {
      const error = validators[field]?.(form[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof form, value: string) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /** ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !paymentMethod) return;

    if (paymentMethod === "card") {
      router.push("/card-payment");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cart, 
          customer: form, 
          deliveryFee: deliveryFee || 0, 
          total 
        }),
      });

      const data = await res.json();

      if (data.success) {
        await fetch("/api/send-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            customer: form, 
            cart, 
            deliveryFee: deliveryFee || 0, 
            total,
            orderId: data.order.id 
          }),
        });

        await clearCart();
        router.push(`/order-success?orderId=${data.order.id}`);
      } else {
        alert(data.error || t.orderError);
      }
    } catch (err) {
      console.error(err);
      alert(t.orderError);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0)
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
          <p className="text-lg text-gray-600 mb-8">
            {translations[language].cart.empty}
          </p>
          <button
            onClick={() => router.push("/shop")}
            className="bg-wine text-white px-8 py-3 rounded-lg hover:bg-wine/90 transition"
          >
            {translations[language].nav.shop}
          </button>
        </div>
      </>
    );

  return (
    <>
      <PageHero
        titleKey="checkout.title"
        subtitleKey=""
        backgroundImage="/slike/poz2.png"
        minHeight="40vh"
        maxHeight="60vh"
      />

      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">{t.orderSummary}</h2>
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 object-cover rounded"
                    />
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-gray-600">
                        {t.quantity}: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      €{(item.price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      €{item.price} {t.each}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Updated Summary Section */}
            <div className="mt-6 pt-4 border-t space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              
              {/* Delivery */}
              <div className="flex justify-between text-lg">
                <span>{t.delivery}:</span>
                <span className={!form.country ? "text-gray-500 italic" : ""}>
                  {getDeliveryDisplay()}
                </span>
              </div>
              
              {/* Total */}
              <div className="flex justify-between text-xl font-bold border-t pt-3">
                <span>{t.total}:</span>
                <span>
                  {form.country && deliveryFee !== null 
                    ? `€${total.toFixed(2)}`
                    : `€${subtotal.toFixed(2)} + ${t.delivery.toLowerCase()}`
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Customer Form */}
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-2xl font-bold mb-6">{t.customerInfo}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First + Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(["firstName", "lastName"] as (keyof typeof form)[]).map(
                  (field) => (
                    <FormInput
                      key={field}
                      label={t[field]}
                      required
                      value={form[field]}
                      onChange={(val) => handleInputChange(field, val)}
                      error={errors[field]}
                    />
                  )
                )}
              </div>

              {/* Other fields */}
              <FormInput
                label={t.email}
                type="email"
                required
                value={form.email}
                onChange={(val) => handleInputChange("email", val)}
                error={errors.email}
              />
              <FormInput
                label={t.phone}
                type="tel"
                required
                value={form.phone}
                onChange={(val) => handleInputChange("phone", val)}
                error={errors.phone}
              />
              <FormInput
                label={t.address}
                required
                value={form.address}
                onChange={(val) => handleInputChange("address", val)}
                error={errors.address}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormInput
                  label={t.city}
                  required
                  value={form.city}
                  onChange={(val) => handleInputChange("city", val)}
                  error={errors.city}
                />
                <FormInput
                  label={t.postalCode}
                  required
                  value={form.postalCode}
                  onChange={(val) => handleInputChange("postalCode", val)}
                  error={errors.postalCode}
                />
                <CountrySelect
                  label={t.country}
                  value={form.country}
                  onChange={(val) => handleInputChange("country", val)}
                  error={errors.country}
                  language={language}
                  countries={countries}
                />
              </div>

              {/* Notes */}
              <FormInput
                label={t.notes}
                value={form.notes}
                onChange={(val) => handleInputChange("notes", val)}
                textarea
              />

              {/* Payment */}
              <div className="mt-4">
                <span className="block text-sm font-medium text-gray-700 mb-2">
                  Način plaćanja *
                </span>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center space-x-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="form-radio h-5 w-5 text-wine"
                    />
                    <span>{t.paymentCard}</span>
                  </label>
                  <label className="inline-flex items-center space-x-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="form-radio h-5 w-5 text-wine"
                    />
                    <span>{t.paymentCod}</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !paymentMethod}
                className={`w-full py-3 rounded-lg text-lg font-semibold transition ${
                  paymentMethod
                    ? "bg-wine text-white hover:bg-wine/90"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {loading ? t.processing : t.placeOrder}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

function FormInput({
  label,
  required,
  type = "text",
  value,
  onChange,
  error,
  textarea,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  textarea?: boolean;
}) {
  if (textarea) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wine"
        />
      </div>
    );
  }
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && "*"}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wine ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

function CountrySelect({
  label,
  value,
  onChange,
  error,
  language,
  countries,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  language: "hr" | "en" | "de";
  countries: readonly Country[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} *
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wine ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        <option value="">{translations[language].checkout.selectCountry}</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}