/**
 * auth.ts — Clerk-based authentication middleware
 *
 * Replaces our custom JWT auth with Clerk.
 * Uses @clerk/express to validate the session.
 */

import type { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import { getAuth } from '@clerk/express';
import { db } from '../db/client';
import { users } from '../db/tables';
import { eq } from 'drizzle-orm';

// ─── Types ────────────────────────────────────────────────────────────────────

// We keep this interface for compatibility with existing routes
export interface JWTPayload {
  sub: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

declare global {
  namespace Express {
    interface User {
      claims: JWTPayload;
    }
  }
}

import { env } from '../env';
import { createClerkClient } from '@clerk/backend';
const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

// ─── Middleware ────────────────────────────────────────────────────────────────

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  
  if (!auth.userId) {
    return res.status(401).json({ message: 'Unauthorized — no valid session' });
  }

  try {
    const clerkId = auth.userId;
    
    // Find or create the user in our local DB (JIT Sync)
    let [user] = await db.select().from(users).where(eq(users.id, clerkId));
    
    if (!user) {
      console.log(`[Auth] JIT Syncing new Clerk user: ${clerkId}`);
      const clerkUser = await clerkClient.users.getUser(clerkId);
      
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      const firstName = clerkUser.firstName || 'User';
      const lastName = clerkUser.lastName || '';
      const profileImageUrl = clerkUser.imageUrl;

      [user] = await db.insert(users).values({
        id: clerkId,
        email,
        firstName,
        lastName,
        profileImageUrl
      } as any).returning();
      
      console.log(`[Auth] Successfully synced user: ${email}`);
    }

    (req as any).user = {
      claims: {
        sub: auth.userId,
        email: user.email || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
      }
    };

    return next();
  } catch (error) {
    console.error('Auth middleware error during JIT sync:', error);
    return res.status(401).json({ message: 'Unauthorized — session validation failed' });
  }
};

// ─── Route Setup ──────────────────────────────────────────────────────────────

export async function setupAuth(app: Express) {
  /**
   * GET /api/auth/user — return current user profile
   * (used by client to sync state)
   */
  app.get('/api/auth/user', isAuthenticated, async (req: any, res: Response) => {
    try {
      const clerkId = req.user.claims.sub;
      
      // Find the user in our local DB
      let [user] = await db.select().from(users).where(eq(users.id, clerkId));
      
      // If user doesn't exist, we create them (JIT Sync)
      if (!user) {
        console.log(`Syncing new Clerk user: ${clerkId}`);
        const clerkUser = await clerkClient.users.getUser(clerkId);
        
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        const firstName = clerkUser.firstName || 'User';
        const lastName = clerkUser.lastName || '';
        const profileImageUrl = clerkUser.imageUrl;

        [user] = await db.insert(users).values({
          id: clerkId,
          email,
          firstName,
          lastName,
          profileImageUrl
        } as any).returning();
        
        console.log(`Successfully synced user: ${email}`);
      }
      
      return res.json(user);
    } catch (error) {
      console.error('Error fetching/syncing user:', error);
      return res.status(500).json({ message: 'Failed to sync user' });
    }
  });
}
