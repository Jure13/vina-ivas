import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/app/lib/validation";
import { z } from "zod";
import Database from "better-sqlite3";
import path from "path";
import { rateLimit, getClientIp } from "@/app/lib/rateLimit";
import { invalidateStockCache } from "@/app/lib/stockCache";

const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

interface StockRow {
  wine_id: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  let db: InstanceType<typeof Database> | null = null;

  try {
    const clientIp = getClientIp(req);
    const { limited } = rateLimit(`checkout:${clientIp}`, 10, 60 * 60 * 1000);

    if (limited) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    console.log("=== CHECKOUT DEBUG ===");
    console.log("Received body:", JSON.stringify(body, null, 2));
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      console.log("Validation errors:", JSON.stringify(validation.error.issues, null, 2));
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const { cart, customer, deliveryFee = 0, total, paymentIntentId } = validation.data;

    db = new Database(dbPath);

    const checkStmt = db.prepare("SELECT quantity FROM stock WHERE wine_id = ?");

    for (const item of cart) {
      const row = checkStmt.get(item.id) as StockRow | undefined;

      if (!row) {
        db.close();
        return NextResponse.json(
          { error: `Wine ${item.name} not found in stock` },
          { status: 400 }
        );
      }

      if (row.quantity < item.quantity) {
        db.close();
        return NextResponse.json(
          { error: `Not enough stock for ${item.name}. Available: ${row.quantity}` },
          { status: 400 }
        );
      }
    }

    const calculatedTotal =
      total ?? cart.reduce((sum, i) => sum + i.price * i.quantity, 0) + deliveryFee;

    const placeOrder = db.transaction(() => {
      const updateStmt = db!.prepare(
        "UPDATE stock SET quantity = quantity - ? WHERE wine_id = ?"
      );
      cart.forEach((item) => updateStmt.run(item.quantity, item.id));

      const orderId = Date.now();
      const orderDate = new Date().toISOString();

      db!.prepare(
        "INSERT INTO orders (id, date, total, items, customer_email, customer_name, payment_status, payment_intent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(
        orderId,
        orderDate,
        calculatedTotal,
        JSON.stringify(cart),
        customer.email,
        `${customer.firstName} ${customer.lastName}`,
        paymentIntentId ? "pending" : "cod",
        paymentIntentId ?? null
      );

      return {
        id: orderId,
        date: orderDate,
        total: calculatedTotal,
        items: JSON.stringify(cart),
      };
    });

    const newOrder = placeOrder();

    invalidateStockCache();

    const stockRows = db
      .prepare("SELECT wine_id, quantity FROM stock")
      .all() as StockRow[];
    const stockObj: Record<string, number> = {};
    stockRows.forEach((r) => (stockObj[r.wine_id] = r.quantity));

    db.close();

    return NextResponse.json({ success: true, stock: stockObj, order: newOrder });
  } catch (err) {
    if (db) db.close();

    console.error("Checkout error:", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Server error processing checkout" },
      { status: 500 }
    );
  }
}
