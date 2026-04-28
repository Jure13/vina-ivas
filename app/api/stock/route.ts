import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import { getStockCache, setStockCache } from "@/app/lib/stockCache";

const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

const validWineIds = ["wine1", "wine2", "wine3", "wine4", "wine5", "wine6"];
const emptyStock = Object.fromEntries(validWineIds.map((id) => [id, 0]));

export async function GET() {
  let db: InstanceType<typeof Database> | null = null;

  try {
    const cachedData = getStockCache();
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
          "X-Cache": "HIT",
        },
      });
    }

    db = new Database(dbPath, { readonly: true });

    const stockRows = db
      .prepare(
        "SELECT wine_id, quantity FROM stock WHERE wine_id IN (?, ?, ?, ?, ?, ?)"
      )
      .all(...validWineIds) as { wine_id: string; quantity: number }[];

    const stockObj: Record<string, number> = { ...emptyStock };
    stockRows.forEach((r) => {
      stockObj[r.wine_id] = r.quantity;
    });

    db.close();

    setStockCache(stockObj);

    return NextResponse.json(stockObj, {
      headers: {
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    if (db) db.close();
    console.error("Stock fetch error:", err);
    return NextResponse.json(emptyStock);
  }
}
