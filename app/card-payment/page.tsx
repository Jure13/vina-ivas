"use client";

import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCheckout } from "../context/CheckoutContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";
import { useRouter } from "next/navigation";
import PageHero from "../components/PageHero";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const cardElementOptions: any = {
  style: {
    base: { fontSize: "16px", "::placeholder": { color: "#aab7c4" } },
    invalid: { color: "#9e2146" },
  },
  hidePostalCode: true,
};

function CardPaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { cart, clearCart, refreshStock } = useCart();
  const { language } = useLanguage();
  const router = useRouter();

  const { form, paymentMethod, deliveryFee, setDeliveryFee } = useCheckout();

  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const t = translations[language].checkout;
  const countries = translations[language].countries;

  // Calculate delivery fee dynamically
  useEffect(() => {
    const country = countries.find(c => c.code === form.country);
    if (country) setDeliveryFee(country.deliveryCalculator(cart.reduce((sum, i) => sum + i.price * i.quantity, 0)));
  }, [form.country, cart, countries, setDeliveryFee]);

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + deliveryFee;

  // Get ISO2 code dynamically from countries list
  const toISO2Country = (input?: string) => {
    if (!input) return undefined;
  
    // Find the country in our list
    const country = countries.find(c => c.code === input);
  
    // For "rest of" options, don't send country to Stripe
    // Stripe will use postal code and other billing info instead
    if (!country || ['restEU', 'restEurope', 'restWorld'].includes(country.code)) {
      return undefined;
    }
  
    // Return the actual country code (HR, DE, AT, etc.)
    return country.code.toUpperCase();
};

  const getDeliveryDisplay = () => {
    if (!form.country) return "Prema odabiru";
    if (deliveryFee === 0) return "Besplatno";
    return `€${deliveryFee.toFixed(2)}`;
  };

  useEffect(() => {
    if (cart.length === 0 || paymentMethod !== "card") router.replace("/checkout");
  }, [cart.length, paymentMethod, router]);

  useEffect(() => {
    if (!cart.length) return;
    (async () => {
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Math.round(total * 100), currency: "eur" }),
        });
        const data = await res.json();
        if (!data.clientSecret) throw new Error(data.error || "Failed to create payment intent");
        setClientSecret(data.clientSecret);
      } catch (e: any) {
        setError(e.message || "Failed to initialize payment");
      }
    })();
  }, [total, cart.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);
    setError(null);

    try {
      const card = elements.getElement(CardElement);
      if (!card) throw new Error("Card field not found.");

      const countryCode = toISO2Country(form.country);

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
          card,
          billing_details: {
            name: `${form.firstName} ${form.lastName}`.trim(),
            email: form.email || undefined,
            phone: form.phone || undefined,
            address: {
              line1: form.address || undefined,
              city: form.city || undefined,
              postal_code: form.postalCode || undefined,
              // Only include country if we have a valid 2-letter ISO code
              ...(countryCode ? { country: countryCode } : {}),
            },
          },
      },
    });

      if (stripeError) throw stripeError;
      if (paymentIntent?.status !== "succeeded") throw new Error("Payment was not completed.");

      const orderRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart, customer: form, deliveryFee, total, paymentIntentId: paymentIntent.id }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error || t.orderError);

      await fetch("/api/send-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: form, cart, deliveryFee, total, orderId: orderData.order.id, language }),
      });

      await clearCart();
      await refreshStock();
      router.replace(`/order-success?orderId=${orderData.order.id}`);
    } catch (err: any) {
      setError(err.message || t.orderError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">{t.paymentCard}</h2>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">{t.orderSummary}</h3>
          {cart.map(i => (
            <div key={i.id} className="flex justify-between text-sm">
              <span>{i.name} × {i.quantity}</span>
              <span>€{(i.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}

          <div className="border-t pt-2 mt-2 flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>€{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Dostava:</span>
            <span className={!form.country ? "text-gray-500 italic" : ""}>{getDeliveryDisplay()}</span>
          </div>
          <div className="border-t pt-2 mt-2 font-bold flex justify-between">
            <span>Ukupno:</span>
            <span>€{total.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.paymentCard}</label>
          <div className="border border-gray-300 rounded-lg p-3">
            <CardElement options={cardElementOptions} onChange={e => setCardComplete(e.complete)} />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">{error}</div>}

          <button
            type="submit"
            disabled={!stripe || !clientSecret || loading || !cardComplete}
            className={`mt-6 w-full py-3 rounded-lg font-semibold transition ${!stripe || !clientSecret || loading || !cardComplete ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-wine text-white hover:bg-wine/90"}`}
          >
            {loading ? t.processing : `Plati €${total.toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <PageHero titleKey="checkout.title" subtitleKey="" backgroundImage="/slike/poz2.png" minHeight="40vh" maxHeight="60vh" />
      <Elements stripe={stripePromise}>
        <CardPaymentForm />
      </Elements>
    </>
  );
}