import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password === ADMIN_PASSWORD) {
    return NextResponse.json({ success: true, token: ADMIN_TOKEN });
  }

  return NextResponse.json({ success: false }, { status: 401 });
}