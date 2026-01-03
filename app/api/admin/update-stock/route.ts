import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

export async function POST(req: NextRequest) {
  try {
    const { stock: updatedStock } = await req.json() as { stock: Record<string, number> };
    const authHeader = req.headers.get("authorization");

    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = new Database(dbPath);

    const stmt = db.prepare(`
      INSERT INTO stock (wine_id, quantity)
      VALUES (@wine_id, @quantity)
      ON CONFLICT(wine_id) DO UPDATE SET quantity=@quantity
    `);

    for (const id in updatedStock) {
      stmt.run({ wine_id: id, quantity: updatedStock[id] });
    }

    const stockRows = db.prepare("SELECT wine_id, quantity FROM stock").all() as { wine_id: string, quantity: number }[];
    const stockObj: Record<string, number> = {};
    stockRows.forEach(r => stockObj[r.wine_id] = r.quantity);

    db.close();
    return NextResponse.json({ success: true, stock: stockObj });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}