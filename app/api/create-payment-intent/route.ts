import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
  apiVersion: "2025-07-30.basil" // Use a stable API version
});

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = "eur" } = await req.json();

    if (!amount || amount < 50) { // Stripe minimum is 50 cents
      return NextResponse.json({ 
        error: "Invalid amount" 
      }, { status: 400 });
    }

    console.log("Creating payment intent for amount:", amount, currency);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure it's an integer
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        source: "vina-ivas-webshop",
      },
    });

    console.log("Payment intent created:", paymentIntent.id);

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error: any) {
    console.error("Payment intent creation error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create payment intent" 
    }, { status: 500 });
  }
}