"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  customCountry: string;
  notes: string;
}

interface CheckoutContextType {
  form: CheckoutForm;
  setForm: React.Dispatch<React.SetStateAction<CheckoutForm>>;
  paymentMethod: "card" | "cod" | null;
  setPaymentMethod: React.Dispatch<React.SetStateAction<"card" | "cod" | null>>;
  deliveryFee: number;
  setDeliveryFee: React.Dispatch<React.SetStateAction<number>>;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<CheckoutForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    customCountry: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod" | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  return (
    <CheckoutContext.Provider
      value={{ form, setForm, paymentMethod, setPaymentMethod, deliveryFee, setDeliveryFee }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) throw new Error("useCheckout must be used within a CheckoutProvider");
  return context;
}