// Server-side configuration
// This file should never be imported in client components

// For local development, we have fallback values
// In production, environment variables MUST be set
const isDevelopment = process.env.NODE_ENV === 'development';

export const serverConfig = {
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || 
    (isDevelopment 
      ? "$2b$10$0zHgyAwvAGhabMuJueChluFPKXRK2Yg3ZtFbFoMAilNWCrrZxFbva" 
      : (() => { throw new Error('ADMIN_PASSWORD_HASH must be configured in production'); })()
    ),
  
  jwtSecret: process.env.JWT_SECRET || 
    (isDevelopment 
      ? "d312065REDACTED" 
      : (() => { throw new Error('JWT_SECRET must be configured in production'); })()
    ),
  
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  }
} as const;

// Validate on server startup
if (typeof window === 'undefined') {
  console.log('🔧 Server config loaded:', {
    hasAdminHash: !!serverConfig.adminPasswordHash,
    hasJwtSecret: !!serverConfig.jwtSecret,
    environment: process.env.NODE_ENV,
  });
}