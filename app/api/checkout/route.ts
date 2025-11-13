import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface StockRow {
  wine_id: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const { cart } = await req.json() as { cart: CartItem[] };
    if (!Array.isArray(cart)) {
      return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
    }

    const db = new Database(dbPath);

    const checkStmt = db.prepare("SELECT quantity FROM stock WHERE wine_id = ?");
    for (const item of cart) {
      const row = checkStmt.get(item.id) as StockRow | undefined;
      if (!row || row.quantity < item.quantity) {
        db.close();
        return NextResponse.json(
          { error: `Not enough stock for ${item.name}` },
          { status: 400 }
        );
      }
    }

    const updateStmt = db.prepare("UPDATE stock SET quantity = quantity - ? WHERE wine_id = ?");
    const deduct = db.transaction(() => {
      cart.forEach((item) => updateStmt.run(item.quantity, item.id));
    });
    deduct();

    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const newOrder = {
      id: Date.now(),
      date: new Date().toISOString(),
      total,
      items: JSON.stringify(cart),
    };
    db.prepare(
      "INSERT INTO orders (id, date, total, items) VALUES (@id, @date, @total, @items)"
    ).run(newOrder);

    const stockRows: StockRow[] = db.prepare("SELECT wine_id, quantity FROM stock").all() as StockRow[];
    const stockObj: Record<string, number> = {};
    stockRows.forEach((r) => (stockObj[r.wine_id] = r.quantity));

    db.close();
    return NextResponse.json({ success: true, stock: stockObj, order: newOrder });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}