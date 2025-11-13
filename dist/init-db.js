"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
// Path to your database
const dbPath = path_1.default.join(process.cwd(), "data", "winery.sqlite");
// Open (or create) the database
const db = new better_sqlite3_1.default(dbPath);
// Create wines table
db.prepare(`
  CREATE TABLE IF NOT EXISTS wines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL
  )
`).run();
// Insert initial wines
const wines = [
    { id: "wine1", name: "Red Wine", description: "Full-bodied red", price: 15, stock: 100 },
    { id: "wine2", name: "White Wine", description: "Crisp and fresh", price: 12, stock: 100 },
    { id: "wine3", name: "Rosé", description: "Light and fruity", price: 14, stock: 100 },
    { id: "wine4", name: "Sparkling", description: "Celebration wine", price: 18, stock: 100 },
    { id: "wine5", name: "Dessert Wine", description: "Sweet and smooth", price: 20, stock: 100 },
];
// Insert or replace (so script is idempotent)
const insert = db.prepare(`
  INSERT OR REPLACE INTO wines (id, name, description, price, stock) 
  VALUES (@id, @name, @description, @price, @stock)
`);
wines.forEach((wine) => insert.run(wine));
console.log("Database initialized with wines.");
db.close();
