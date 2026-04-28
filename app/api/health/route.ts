import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "winery.sqlite");

export async function GET() {
  const checks: {
    status: string;
    timestamp: string;
    database: string;
    memory: NodeJS.MemoryUsage;
    uptime: number;
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    database: "unknown",
    memory: process.memoryUsage(),
    uptime: process.uptime(),
  };

  try {
    const db = new Database(dbPath, { readonly: true });
    db.prepare("SELECT 1").get();
    db.close();
    checks.database = "connected";
  } catch {
    checks.database = "error";
    checks.status = "degraded";
  }

  return NextResponse.json(checks, {
    status: checks.status === "ok" ? 200 : 503,
  });
}
