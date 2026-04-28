import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { serverConfig } from "@/app/lib/config";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

function getStripe() {
  const apiKey = serverConfig.stripe.secretKey;
  if (!apiKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(apiKey, { apiVersion: "2025-07-30.basil" });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment succeeded: ${paymentIntent.id}`);

        const db = new Database(dbPath);
        try {
          db.prepare(
            "UPDATE orders SET payment_status = ?, payment_intent_id = ? WHERE payment_intent_id = ?"
          ).run("paid", paymentIntent.id, paymentIntent.id);
        } finally {
          db.close();
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error(`Payment failed: ${paymentIntent.id}`);

        const db = new Database(dbPath);
        try {
          db.prepare(
            "UPDATE orders SET payment_status = ? WHERE payment_intent_id = ?"
          ).run("failed", paymentIntent.id);
        } finally {
          db.close();
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
