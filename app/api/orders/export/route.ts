import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ordersFile = path.join(process.cwd(), "data", "orders.json");

export async function GET(req: Request) {
  try {
    // --- Check admin token from query params ---
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token || token !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Ensure orders file exists ---
    if (!fs.existsSync(ordersFile)) {
      return new Response("No orders found", {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=orders.csv",
        },
      });
    }

    // --- Load orders ---
    const rawOrders = fs.readFileSync(ordersFile, "utf-8");
    const orders = JSON.parse(rawOrders);

    if (!Array.isArray(orders) || orders.length === 0) {
      return new Response("No orders found", {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=orders.csv",
        },
      });
    }

    // --- Convert to CSV ---
    const header = ["Order ID", "Date", "Wine ID", "Wine Name", "Quantity", "Price", "Subtotal"];
    const rows: string[] = [header.join(",")];

    for (const order of orders) {
      for (const item of order.items) {
        rows.push(
          [
            order.id,
            order.date,
            item.id,
            `"${item.name}"`, // quotes to protect commas
            item.quantity,
            item.price.toFixed(2),
            (item.price * item.quantity).toFixed(2),
          ].join(",")
        );
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