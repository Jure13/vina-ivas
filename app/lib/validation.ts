import { z } from "zod";

export const cartItemSchema = z.object({
  id: z.string().regex(/^wine[1-6]$/, "Invalid wine ID"),
  name: z.string().min(1).max(100),
  price: z.number().positive().max(10000),
  quantity: z.number().int().positive().max(100),
});

export const customerSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email().max(255),
  phone: z.string().min(3).max(50).trim(),
  address: z.string().min(1).max(500).trim(),
  city: z.string().min(1).max(100).trim(),
  postalCode: z.string().min(1).max(20).trim(),
  country: z.string().min(2).max(100).trim(),
  customCountry: z.string().max(100).trim().optional().or(z.literal('')),
  notes: z.string().max(1000).optional(),
});

export const checkoutSchema = z.object({
  cart: z.array(cartItemSchema).min(1, "Cart cannot be empty").max(50),
  customer: customerSchema,
  deliveryFee: z.number().min(0).max(1000).optional(),
  total: z.number().positive().max(100000).optional(),
  paymentIntentId: z.string().optional(),
});

export const sendOrderSchema = z.object({
  customer: customerSchema,
  cart: z.array(cartItemSchema).min(1),
  orderId: z.union([z.string(), z.number()]),
  deliveryFee: z.number().min(0).optional(),
  total: z.number().positive().optional(),
  language: z.enum(["hr", "en", "de"]).optional().default("hr"),
});