import { NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Simple in-memory rate limiter
export function rateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { limited: boolean; remaining: number } {
  const now = Date.now();
  const record = store[identifier];

  // Clean up old entries
  if (record && now > record.resetTime) {
    delete store[identifier];
  }

  if (!store[identifier]) {
    store[identifier] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return { limited: false, remaining: maxRequests - 1 };
  }

  store[identifier].count++;

  if (store[identifier].count > maxRequests) {
    return { limited: true, remaining: 0 };
  }

  return {
    limited: false,
    remaining: maxRequests - store[identifier].count,
  };
}

// Helper to get client IP
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}