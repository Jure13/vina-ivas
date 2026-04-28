import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { serverConfig } from "@/app/lib/config";
import { rateLimit, getClientIp } from "@/app/lib/rateLimit";

const paymentIntentSchema = z.object({
  amount: z.number().int().min(50).max(10000000),
  currency: z.string().regex(/^[a-z]{3}$/).default("eur"),
});

function getStripe() {
  const apiKey = serverConfig.stripe.secretKey;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(apiKey, {
    apiVersion: "2025-07-30.basil",
  });
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const { limited } = rateLimit(`payment-intent:${clientIp}`, 20, 60 * 60 * 1000);

    if (limited) {
      return NextResponse.json(
        { error: "Too many payment requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = paymentIntentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid payment data",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { amount, currency } = validation.data;

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        source: "vina-ivas-webshop",
        created_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: unknown) {
    console.error("Payment intent creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
