/**
 * config/index.ts — Centralised configuration
 *
 * Single source of truth for all environment-driven config.
 * Import from here rather than sprinkling process.env access throughout the app.
 */

export const config = {
  // ── App ────────────────────────────────────────────────────────────────────
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000'),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),

  // ── Database ───────────────────────────────────────────────────────────────
  databaseUrl: process.env.DATABASE_URL!,

  // ── Auth ───────────────────────────────────────────────────────────────────
  jwtSecret: process.env.JWT_SECRET || process.env.SESSION_SECRET || 'change_me_in_production',

  // ── OpenAI ────────────────────────────────────────────────────────────────
  openaiApiKey: process.env.OPENAI_API_KEY!,

  // ── Paystack ──────────────────────────────────────────────────────────────
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY!,
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '',

  // ── SendGrid ──────────────────────────────────────────────────────────────
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@yourdomain.com',
} as const;
