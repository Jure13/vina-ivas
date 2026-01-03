"use strict";
import Database from "better-sqlite3";
import path from "path";

// Path to your database
const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

// Open (or create) the database
const db = new Database(dbPath);

// Create wines table (no stock column)
db.prepare(`
  CREATE TABLE IF NOT EXISTS wines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL
  )
`).run();

// Create stock table
db.prepare(`
  CREATE TABLE IF NOT EXISTS stock (
    wine_id TEXT PRIMARY KEY,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (wine_id) REFERENCES wines(id)
  )
`).run();

// Insert initial wines
const wines = [
  { id: "wine1", name: "Red Wine", description: "Full-bodied red", price: 15 },
  { id: "wine2", name: "White Wine", description: "Crisp and fresh", price: 12 },
  { id: "wine3", name: "Rosé", description: "Light and fruity", price: 14 },
  { id: "wine4", name: "Sparkling", description: "Celebration wine", price: 18 },
  { id: "wine5", name: "Dessert Wine", description: "Sweet and smooth", price: 20 },
  { id: "wine6", name: "Special Wine", description: "Limited edition", price: 25 },
];

const insertWine = db.prepare(`
  INSERT OR REPLACE INTO wines (id, name, description, price) 
  VALUES (@id, @name, @description, @price)
`);

const insertStock = db.prepare(`
  INSERT INTO stock (wine_id, quantity)
  VALUES (?, ?)
  ON CONFLICT(wine_id) DO NOTHING
`);

wines.forEach(w => {
  insertWine.run(w);
  insertStock.run(w.id, 100); // default stock = 100
});

console.log("Database initialized with wines and stock.");
db.close();