import * as dotenv from 'dotenv';
import path from 'path';

// Allow local loading of .env, but gracefully ignore in Vercel
// Avoid import.meta.url as it crashes Vercel's Serverless CommonJS build
if (process.env.VERCEL !== '1') {
  const envPath = path.resolve(process.cwd(), '../.env');
  dotenv.config({ path: envPath });
} else {
  // In Vercel, env vars are automatically loaded
  dotenv.config();
}

/**
 * Validated environment variables with defaults or lazy error handling.
 */
export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  VITE_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'moderncouture@icloud.com',
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Check critical variables immediately
if (!env.DATABASE_URL) {
  throw new Error(`❌ DATABASE_URL is missing from environment variables`);
}

if (!env.CLERK_SECRET_KEY) {
  throw new Error(`❌ CLERK_SECRET_KEY is missing from environment variables`);
}
