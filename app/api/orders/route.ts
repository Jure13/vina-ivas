import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import { verifyAdmin } from "@/app/lib/auth";

const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

interface OrderRow {
  id: number;
  date: string;
  total: number;
  items: string;
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = new Database(dbPath);
    try {
      const result = db.prepare("DELETE FROM orders").run();
      return NextResponse.json({ success: true, deleted: result.changes });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error("Delete orders error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const admin = verifyAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = new Database(dbPath);
    const orders: OrderRow[] = db
      .prepare("SELECT * FROM orders ORDER BY date DESC")
      .all() as OrderRow[];
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

  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}