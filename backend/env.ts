import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Support both ESM and CJS for path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env relative to this file
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

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
  console.error(`❌ DATABASE_URL is missing from ${envPath}`);
  process.exit(1);
}

if (!env.CLERK_SECRET_KEY) {
  console.error(`❌ CLERK_SECRET_KEY is missing from ${envPath}`);
  process.exit(1);
}
