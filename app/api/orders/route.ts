import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

interface OrderRow {
  id: number;
  date: string;
  total: number;
  items: string;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = new Database(dbPath);
    const orders: OrderRow[] = db.prepare("SELECT * FROM orders").all() as OrderRow[];
    db.close();

    const accept = req.headers.get("accept") || "";
    if (accept.includes("text/csv")) {
      const header = "Order ID,Date,Wine ID,Wine Name,Price,Quantity,Subtotal\n";
      const rows = orders.flatMap((order) => {
        const items = JSON.parse(order.items);
        return items.map((item: any) =>
          [
            order.id,
            order.date,
            item.id,
            `"${item.name}"`,
            item.price.toFixed(2),
            item.quantity,
            (item.price * item.quantity).toFixed(2),
          ].join(",")
        );
      });
      const csv = header + rows.join("\n");
      
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=orders.csv",
        },
      });
    }

    return NextResponse.json(orders);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}