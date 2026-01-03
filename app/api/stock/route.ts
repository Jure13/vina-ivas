import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

export async function GET() {
  try {
    const db = new Database(dbPath);

    // Get all wines
    const wines = db.prepare("SELECT id FROM wines").all() as { id: string }[];
    const stockRows = db.prepare("SELECT wine_id, quantity FROM stock").all() as { wine_id: string, quantity: number }[];

    const stockObj: Record<string, number> = {};
    wines.forEach(w => {
      const row = stockRows.find(r => r.wine_id === w.id);
      stockObj[w.id] = row?.quantity ?? 0;
    });

    db.close();
    return NextResponse.json(stockObj);
  } catch (err) {
    console.error("Stock fetch error:", err);
    return NextResponse.json({});
  }
}