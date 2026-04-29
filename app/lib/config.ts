// Server-side configuration
// This file should never be imported in client components

const isDevelopment = process.env.NODE_ENV === 'development';
// next build runs with NODE_ENV=production but NEXT_PHASE=phase-production-build.
// Routes are compiled but never called during build, so real secrets aren't needed.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

export const serverConfig = {
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ||
    (isDevelopment || isBuildPhase
      ? "$2b$10$0zHgyAwvAGhabMuJueChluFPKXRK2Yg3ZtFbFoMAilNWCrrZxFbva"
      : (() => { throw new Error('ADMIN_PASSWORD_HASH must be configured in production'); })()
    ),

  jwtSecret: process.env.JWT_SECRET ||
    (isDevelopment || isBuildPhase
      ? "dev-only-jwt-secret-change-in-production"
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

if (typeof window === 'undefined') {
  console.log('🔧 Server config loaded:', {
    hasAdminHash: !!serverConfig.adminPasswordHash,
    hasJwtSecret: !!serverConfig.jwtSecret,
    environment: process.env.NODE_ENV,
    buildPhase: process.env.NEXT_PHASE ?? '(runtime)',
    smtp: {
      host: serverConfig.smtp.host || '(not set)',
      port: serverConfig.smtp.port || '(not set)',
      user: serverConfig.smtp.user || '(not set)',
      hasPass: !!serverConfig.smtp.pass,
    },
  });
}
