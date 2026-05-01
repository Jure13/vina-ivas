"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";
import { useRouter } from "next/navigation";
import PageHero from "../components/PageHero";
import { useCheckout } from "../context/CheckoutContext";
import toast from "react-hot-toast";

type Country = {
  code: string;
  name: string;
  deliveryFee: number;
  deliveryCalculator: (subtotal: number) => number;
};

export default function CheckoutPage() {
  // ---------------- CONTEXTS ----------------
  const { cart, clearCart, refreshStock } = useCart();
  const { language } = useLanguage();
  const router = useRouter();
  const { form, setForm, paymentMethod, setPaymentMethod, deliveryFee, setDeliveryFee } =
    useCheckout();

  const t = translations[language].checkout;
  const countries = translations[language].countries;

  // ---------------- STATE ----------------
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  //Prevent empty cart redirecti
  const [orderPlaced, setOrderPlaced] = useState(false);

  // ---------------- DERIVED VALUES ----------------
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selectedCountry: Country | undefined = countries.find((c) => c.code === form.country);
  const total = subtotal + deliveryFee;

  const isOtherCountry =
    form.country === "restEU" || form.country === "restEurope" || form.country === "restWorld";
  const showCustomCountryField = isOtherCountry;

  const getDeliveryDisplay = () => {
    if (!form.country || !selectedCountry) return t.deliveryDepends;
    if (deliveryFee === 0) return t.deliveryFree;
    return t.deliveryPaid.replace("{amount}", deliveryFee.toFixed(2));
  };

  // ---------------- VALIDATORS ----------------
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
    customCountry: (v) => (isOtherCountry && !v.trim() ? t.required : null),
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

  // ---------------- EFFECTS ----------------
  // Prevent SSR mismatch
  useEffect(() => setMounted(true), []);

  // Redirect if cart is empty
  useEffect(() => {
    if (mounted && cart.length === 0 && !orderPlaced) router.push("/shop");
  }, [cart, mounted, router, orderPlaced]);

  // Update delivery fee
  useEffect(() => {
    if (selectedCountry) {
      setDeliveryFee(selectedCountry.deliveryCalculator(subtotal));
    } else {
      setDeliveryFee(0);
    }
  }, [selectedCountry, subtotal, setDeliveryFee]);

  // ---------------- HANDLERS ----------------
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
        body: JSON.stringify({ cart, customer: form, deliveryFee: deliveryFee || 0, total }),
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
            orderId: data.order.id,
            language,
          }),
        });

        setOrderPlaced(true);

        await clearCart();
        await refreshStock();
        router.push(`/order-success?orderId=${data.order.id}`);
      } else {
        toast.error(data.error || t.orderError);
      }
    } catch (err) {
      console.error(err);
      toast.error(t.orderError);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- EARLY RETURNS ----------------
  if (!mounted) return null;

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
          <p className="text-lg text-gray-600 mb-8">{translations[language].cart.empty}</p>
          <button
            onClick={() => router.push("/shop")}
            className="bg-wine text-white px-8 py-3 rounded-lg hover:bg-wine/90 transition"
          >
            {translations[language].nav.shop}
          </button>
        </div>
      </>
    );

  // ---------------- MAIN RENDER ----------------
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
          {/* ORDER SUMMARY */}
          <OrderSummary
            cart={cart}
            subtotal={subtotal}
            total={total}
            deliveryFee={deliveryFee}
            form={form}
            getDeliveryDisplay={getDeliveryDisplay}
            t={t}
          />

          {/* CUSTOMER FORM */}
          <CustomerForm
            form={form}
            errors={errors}
            handleInputChange={handleInputChange}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            handleSubmit={handleSubmit}
            loading={loading}
            t={t}
            language={language}
            countries={countries}
            showCustomCountryField={showCustomCountryField}
          />
        </div>
      </div>
    </>
  );
}

// ---------------- ORDER SUMMARY COMPONENT ----------------
const OrderSummary = React.memo(function OrderSummary({
  cart,
  subtotal,
  total,
  deliveryFee,
  form,
  getDeliveryDisplay,
  t,
}: any) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">{t.orderSummary}</h2>
      <div className="space-y-4">
        {cart.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center space-x-4">
              <Image src={item.image} alt={item.name} width={64} height={64} className="h-16 w-16 object-cover rounded" />
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-gray-600">
                  {t.quantity}: {item.quantity}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">€{(item.price * item.quantity).toFixed(2)}</p>
              <p className="text-sm text-gray-600">€{item.price} {t.each}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t space-y-3">
        <div className="flex justify-between text-lg">
          <span>{t.subtotal}:</span>
          <span>€{subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-lg">
          <span>{t.delivery}:</span>
          <span className={!form.country ? "text-gray-500 italic" : ""}>{getDeliveryDisplay()}</span>
        </div>

        <div className="flex justify-between text-xl font-bold border-t pt-3">
          <span>{t.total}:</span>
          <span>
            {form.country && deliveryFee !== null
              ? `€${total.toFixed(2)}`
              : `€${subtotal.toFixed(2)} + ${t.delivery.toLowerCase()}`}
          </span>
        </div>
      </div>
    </div>
  );
});

// ---------------- CUSTOMER FORM COMPONENT ----------------
const CustomerForm = React.memo(function CustomerForm({
  form,
  errors,
  handleInputChange,
  paymentMethod,
  setPaymentMethod,
  handleSubmit,
  loading,
  t,
  language,
  countries,
  showCustomCountryField,
}: any) {
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h2 className="text-2xl font-bold mb-6">{t.customerInfo}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(["firstName", "lastName"] as (keyof typeof form)[]).map((field) => (
            <FormInput
              key={String(field)}
              label={t[field]}
              required
              value={form[field]}
              onChange={(val) => handleInputChange(field, val)}
              error={errors[field]}
            />
          ))}
        </div>

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

        {showCustomCountryField && (
          <FormInput
          label={t.customCountry}
          required
          value={form.customCountry || ""}
          onChange={(val) => handleInputChange("customCountry", val)}
          error={errors.customCountry}
          />
        )}

        <FormInput
          label={t.notes}
          value={form.notes}
          onChange={(val) => handleInputChange("notes", val)}
          textarea
        />

        <div className="mt-4">
          <span className="block text-sm font-medium text-gray-700 mb-2">Način plaćanja *</span>
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
          className={`w-full py-3 rounded-lg text-lg font-semibold transition flex items-center justify-center gap-2 ${
            paymentMethod && !loading
              ? "bg-wine text-white hover:bg-wine/90"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {loading && (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {loading ? t.processing : t.placeOrder}
        </button>
      </form>
    </div>
  );
});

// ---------------- SHARED FORM INPUT ----------------
function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-1 mt-1">
      <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <p className="text-red-500 text-sm">{message}</p>
    </div>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition ${
            error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-wine"
          }`}
        />
        {error && <ErrorMessage message={error} />}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition ${
          error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-wine"
        }`}
      />
      {error && <ErrorMessage message={error} />}
    </div>
  );
}

// ---------------- COUNTRY SELECT ----------------
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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} *</label>
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
