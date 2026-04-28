import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

function addIndexes() {
  const db = new Database(dbPath);

  try {
    console.log("Adding database indexes...");

    db.prepare(
      "CREATE INDEX IF NOT EXISTS idx_stock_wine_id ON stock(wine_id)"
    ).run();

    db.prepare(
      "CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date DESC)"
    ).run();

    db.prepare(
      "CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email)"
    ).run();

    db.prepare(
      "CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status)"
    ).run();

    console.log("✅ Database indexes created successfully");

    const indexes = db
      .prepare("SELECT name FROM sqlite_master WHERE type='index'")
      .all();
    console.log("Current indexes:", indexes);
  } catch (error) {
    console.error("❌ Failed to create indexes:", error);
    throw error;
  } finally {
    db.close();
  }
}

addIndexes();
