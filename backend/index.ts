/**
 * backend/index.ts — Server entry point
 *
 * Clean replacement for server/index.ts:
 *  - Removed Vite serving (frontend is now a separate SPA via /frontend)
 *  - Port configurable via env var
 *  - CORS configured for frontend dev server
 */

import { env } from './env';
import express, { type Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { registerRoutes } from './routes/index';
import { setupAuth } from './middleware/auth';

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(clerkMiddleware());

// Allow the frontend dev server and production origin
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176').split(',');
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));

// ── Request logging ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  const start = Date.now();
  _res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.path} ${_res.statusCode} in ${Date.now() - start}ms`);
    }
  });
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────────────
registerRoutes(app);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  console.error('Unhandled error:', err);
  res.status(status).json({ message });
});

// Start server only if not in a serverless environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  const http = require('http');
  const server = http.createServer(app);
  const PORT = env.PORT || 5001;
  server.listen({ port: PORT, host: '0.0.0.0' }, () => {
    console.log(`🚀 Backend API running on http://localhost:${PORT}`);
  });
}

export default app;
export { app };
