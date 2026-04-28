import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

function migrateDatabase() {
  const db = new Database(dbPath);

  try {
    const tableInfo = db.prepare("PRAGMA table_info(orders)").all() as { name: string }[];
    const hasPaymentStatus = tableInfo.some((col) => col.name === "payment_status");
    const hasPaymentIntentId = tableInfo.some((col) => col.name === "payment_intent_id");

    if (!hasPaymentStatus) {
      console.log("Adding payment_status column...");
      db.prepare("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending'").run();
    }

    if (!hasPaymentIntentId) {
      console.log("Adding payment_intent_id column...");
      db.prepare("ALTER TABLE orders ADD COLUMN payment_intent_id TEXT").run();
    }

    console.log("✅ Payment status migration completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    db.close();
  }
}

migrateDatabase();
