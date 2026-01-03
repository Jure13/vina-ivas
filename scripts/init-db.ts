import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Ensure the data folder exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// SQLite database file
const dbPath = path.join(dataDir, "winery.sqlite");

// Open or create the database
const db = new Database(dbPath);

// Create stock table
db.prepare(`
  CREATE TABLE IF NOT EXISTS stock (
    wine_id TEXT PRIMARY KEY,
    quantity INTEGER NOT NULL
  )
`).run();

// Create orders table
db.prepare(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL,
    total REAL NOT NULL,
    items TEXT NOT NULL
  )
`).run();

// Insert initial stock if table is empty
const rowCount = (db.prepare("SELECT COUNT(*) AS count FROM stock").get() as { count: number }).count;

if (rowCount === 0) {
  const initialStock = [
    { wine_id: "wine1", quantity: 100 },
    { wine_id: "wine2", quantity: 100 },
    { wine_id: "wine3", quantity: 100 },
    { wine_id: "wine4", quantity: 100 },
    { wine_id: "wine5", quantity: 100 },
    { wine_id: "wine6", quantity: 100 },
  ];

  const insertStmt = db.prepare(
    "INSERT INTO stock (wine_id, quantity) VALUES (@wine_id, @quantity)"
  );
  const insertMany = db.transaction((stocks: typeof initialStock) => {
    stocks.forEach(s => insertStmt.run(s));
  });

  insertMany(initialStock);
  console.log("Initial stock inserted into database.");
} else {
  console.log("Stock table already initialized.");
}

db.close();
console.log("Database setup complete.");