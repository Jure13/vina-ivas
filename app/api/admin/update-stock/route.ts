import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Database from "better-sqlite3";
import path from "path";
import { verifyAdmin } from "@/app/lib/auth";
import { invalidateStockCache } from "@/app/lib/stockCache";

const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

// Validation schema
const updateStockSchema = z.object({
  stock: z.record(z.string(), z.number().int().min(0)),
});

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const admin = verifyAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = updateStockSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { stock: updatedStock } = validation.data;

    const db = new Database(dbPath);

    try {
      const stmt = db.prepare(`
        INSERT INTO stock (wine_id, quantity)
        VALUES (@wine_id, @quantity)
        ON CONFLICT(wine_id) DO UPDATE SET quantity=@quantity
      `);

      // Use transaction for atomic updates
      const updateAll = db.transaction(() => {
        for (const id in updatedStock) {
          stmt.run({ wine_id: id, quantity: updatedStock[id] });
        }
      });

      updateAll();

      invalidateStockCache();

      // Get updated stock
      const stockRows = db
        .prepare("SELECT wine_id, quantity FROM stock")
        .all() as { wine_id: string; quantity: number }[];

      const stockObj: Record<string, number> = {};
      stockRows.forEach((r) => (stockObj[r.wine_id] = r.quantity));

      return NextResponse.json({ success: true, stock: stockObj });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error("Update stock error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}