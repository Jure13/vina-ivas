import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

interface StockRow {
  wine_id: string;
  quantity: number;
}

export async function GET() {
  try {
    const db = new Database(dbPath);
    const stockRows: StockRow[] = db.prepare("SELECT wine_id, quantity FROM stock").all() as StockRow[];
    console.log("Stock rows from DB:", stockRows);
    db.close();

    console.log("Database path:", dbPath);
    console.log("Database exists:", require('fs').existsSync(dbPath));

    const stockObj: Record<string, number> = {};
    stockRows.forEach((r) => (stockObj[r.wine_id] = r.quantity));
    console.log("Stock object being returned:", stockObj);

    return NextResponse.json(stockObj);
  } catch (err) {
    console.error("Stock fetch error:", err);
    // Fallback to default values if DB fails
    return NextResponse.json({
      wine1: 0,
      wine2: 0,
      wine3: 0,
      wine4: 0,
      wine5: 0,
    });
  }
}