import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

export async function GET(req: Request) {
  try {
    // --- Check admin token from query params ---
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token || token !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Read orders from SQLite ---
    const db = new Database(dbPath);
    const orders = db.prepare("SELECT * FROM orders").all();
    db.close();

    if (!orders.length) {
      return new Response("No orders found", {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=orders.csv",
        },
      });
    }

    // --- Convert orders to CSV ---
    const header = ["Order ID", "Date", "Wine ID", "Wine Name", "Quantity", "Price", "Subtotal"];
    const rows: string[] = [header.join(",")];

    for (const order of orders) {
      const items = JSON.parse(order.items);
      for (const item of items) {
        rows.push([
          order.id,
          order.date,
          item.id,
          `"${item.name}"`,
          item.quantity,
          item.price.toFixed(2),
          (item.price * item.quantity).toFixed(2),
        ].join(","));
      }
    }

    const csvContent = rows.join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=orders.csv",
      },
    });
  } catch (err) {
    console.error("CSV export error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}