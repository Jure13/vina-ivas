import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { serverConfig } from './config';

const JWT_SECRET = serverConfig.jwtSecret;
const JWT_EXPIRES_IN = '24h';

export interface JWTPayload {
  userId: string;
  role: 'admin';
  iat?: number;
  exp?: number;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Verify password using SHA256
export function verifyPasswordSha256(password: string, hashedPassword: string): boolean {
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  return hash === hashedPassword;
}

// Verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Extract token from request headers
export function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Verify admin access
export function verifyAdmin(req: NextRequest): JWTPayload | null {
  const token = extractToken(req);
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  
  return payload;
}