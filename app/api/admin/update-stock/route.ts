import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

interface StockRow {
  wine_id: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const { stock: updatedStock } = await req.json() as { stock: Record<string, number> };
    console.log("Received stock update:", updatedStock);

    const authHeader = req.headers.get("authorization");
    console.log("Auth header:", authHeader);

    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = new Database(dbPath);

    const stmt = db.prepare(
      "UPDATE stock SET quantity = @quantity WHERE wine_id = @wine_id"
    );

    for (const id in updatedStock) {
      console.log(`Updating ${id} to ${updatedStock[id]}`);
      const result = stmt.run({ wine_id: id, quantity: updatedStock[id] });
      console.log("Update result:", result);
    }

    const stockRows: StockRow[] = db.prepare("SELECT wine_id, quantity FROM stock").all() as StockRow[];
    const stockObj: Record<string, number> = {};
    stockRows.forEach((r) => (stockObj[r.wine_id] = r.quantity));

    db.close();
    return NextResponse.json({ success: true, stock: stockObj });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}