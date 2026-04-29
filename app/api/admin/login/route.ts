import { NextRequest, NextResponse } from "next/server";
import { serverConfig } from "@/app/lib/config";
import { z } from "zod";
import { verifyPassword, generateToken } from "@/app/lib/auth";
import { rateLimit, getClientIp } from "../../../lib/rateLimit";

// Validation schema
const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

// In production, this should come from a database
// For now, we'll use the hashed version of your admin password
const ADMIN_PASSWORD_HASH = serverConfig.adminPasswordHash;

export async function POST(req: NextRequest) {
  console.log('HASH FROM ENV:', process.env.ADMIN_PASSWORD_HASH);
  try {
    const clientIp = getClientIp(req);
    
    // Rate limiting: 5 attempts per 15 minutes per IP
    const { limited, remaining } = rateLimit(`login:${clientIp}`, 5, 15 * 60 * 1000);
    
    if (limited) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Too many login attempts. Please try again later." 
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error.issues[0].message 
        },
        { status: 400 }
      );
    }

    const { password } = validation.data;

    // Verify password
    if (!ADMIN_PASSWORD_HASH) {
      console.error("ADMIN_PASSWORD_HASH not configured");
      return NextResponse.json(
        { success: false, error: "Authentication not configured" },
        { status: 500 }
      );
    }

    const isValid = await verifyPassword(password, ADMIN_PASSWORD_HASH);

    if (!isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid credentials",
          remaining 
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: 'admin',
      role: 'admin',
    });

    return NextResponse.json({
      success: true,
      token,
      expiresIn: '24h',
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}