import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

function migrateDatabase() {
  const db = new Database(dbPath);

  try {
    const tableInfo = db.prepare("PRAGMA table_info(orders)").all() as {
      name: string;
    }[];
    const hasCustomerEmail = tableInfo.some((col) => col.name === "customer_email");
    const hasCustomerName = tableInfo.some((col) => col.name === "customer_name");

    if (!hasCustomerEmail) {
      console.log("Adding customer_email column...");
      db.prepare("ALTER TABLE orders ADD COLUMN customer_email TEXT").run();
    }

    if (!hasCustomerName) {
      console.log("Adding customer_name column...");
      db.prepare("ALTER TABLE orders ADD COLUMN customer_name TEXT").run();
    }

    console.log("✅ Database migration completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    db.close();
  }
}

migrateDatabase();
