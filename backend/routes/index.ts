/**
 * backend/routes/index.ts
 *
 * Central route registration.
 * Replaces server/routes.ts + server/payment-routes.ts,
 * with replitAuth replaced by JWT isAuthenticated middleware.
 */

import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { storage } from '../services/storage';
import { setupAuth, isAuthenticated } from '../middleware/auth';
import { freemiumService } from '../services/freemium';
import { generateAIDiagnosticAnalysis } from '../services/ai-diagnostic';
import { sendReportNotification } from '../services/email';
import { registerPaymentRoutes } from './payments';
import { db } from '../db/client';
import { categories } from '../db/tables';
import { eq } from 'drizzle-orm';
import {
  insertCategorySchema,
  updateCategorySchema,
  insertAssessmentSchema,
  insertReportSchema,
} from '../db/tables';
import type { Category } from '../db/tables';

export async function registerRoutes(app: Express): Promise<Server> {
  // ── Usage ────────────────────────────────────────────────────────────────────
  app.get('/api/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getUserSubscription(userId);
      const isSubscribed = subscription?.status === 'active';
      const usage = await freemiumService.getUserUsage(userId, isSubscribed);
      res.json(usage);
    } catch (error) {
      console.error('Error fetching usage:', error);
      res.status(500).json({ message: 'Failed to fetch usage information' });
    }
  });

  // ── Categories ───────────────────────────────────────────────────────────────
  app.get('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await storage.getCategories(userId);
      res.json(result);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const subscription = await storage.getUserSubscription(userId);
      const isSubscribed = subscription?.status === 'active';
      const usage = await freemiumService.getUserUsage(userId, isSubscribed);

      if (!freemiumService.canPerformAction(usage, 'hasCustomCategories')) {
        return res.status(403).json({
          message: freemiumService.getUpgradeMessage('categories'),
          feature: 'custom_categories',
        });
      }

      const validatedData = insertCategorySchema.parse({ ...req.body, userId });
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid category data', error: fromZodError(error).toString() });
      }
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Failed to create category' });
    }
  });

  app.put('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid category ID' });

      const categoryData = updateCategorySchema.parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid category data', error: fromZodError(error).toString() });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ message: 'Category not found' });
      }
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Failed to update category' });
    }
  });

  app.delete('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid category ID' });
      await storage.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Failed to delete category' });
    }
  });

  app.post('/api/categories/reset', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(categories).where(eq(categories.userId, userId));

      const defaultCategories = [
        { name: 'Symptom Severity', description: 'Rate the intensity of primary symptoms', scoreType: '1-10', order: 1, userId },
        { name: 'Functional Impact', description: 'How much symptoms affect daily activities', scoreType: '1-10', order: 2, userId },
        { name: 'Duration', description: 'How long have symptoms been present?', scoreType: '1-10', order: 3, userId },
        { name: 'Frequency', description: 'How often do symptoms occur?', scoreType: '1-10', order: 4, userId },
        { name: 'Associated Factors', description: 'Presence of related symptoms or risk factors', scoreType: '1-10', order: 5, userId },
      ];

      const inserted = await db.insert(categories).values(defaultCategories).returning();
      res.json(inserted);
    } catch (error) {
      console.error('Error resetting categories:', error);
      res.status(500).json({ message: 'Failed to reset categories' });
    }
  });

  // ── Assessments ──────────────────────────────────────────────────────────────
  app.post('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assessment = insertAssessmentSchema.parse({ ...req.body, userId });
      const created = await storage.createAssessment(assessment);
      res.json(created);
    } catch (error) {
      console.error('Assessment validation error:', error);
      res.status(400).json({
        message: 'Invalid assessment data',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get('/api/assessments/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await storage.getRecentAssessments(userId, limit);
      res.json(result);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      res.status(500).json({ message: 'Failed to fetch recent assessments' });
    }
  });

  // ── AI Analysis (core feature) ───────────────────────────────────────────────
  app.post('/api/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { scores, categories: cats } = req.body;

      if (!Array.isArray(scores) || !Array.isArray(cats)) {
        return res.status(400).json({ message: 'Invalid scores or categories data' });
      }
      if (scores.length !== cats.length) {
        return res.status(400).json({ message: 'Scores and categories length mismatch' });
      }

      const subscription = await storage.getUserSubscription(userId);
      const isSubscribed = subscription?.status === 'active';
      const usage = await freemiumService.getUserUsage(userId, isSubscribed);

      if (!usage.canUseAssessment) {
        return res.status(403).json({
          message: freemiumService.getUpgradeMessage('assessment'),
          feature: 'assessment_limit',
          usage: {
            current: usage.assessmentCount,
            limit: usage.limits.maxAssessments,
            remaining: usage.remainingAssessments,
          },
        });
      }

      const analysis = await generateAIDiagnosticAnalysis(scores, cats as Category[], usage.limits.hasAiInsights);

      if (!isSubscribed) {
        await freemiumService.incrementAssessmentCount(userId);
      }

      res.json(analysis);
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ message: 'Failed to generate diagnostic analysis' });
    }
  });

  // ── Reports ──────────────────────────────────────────────────────────────────
  app.post('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;

      const deviceInfo = JSON.stringify({
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
        timestamp: new Date().toISOString(),
      });

      const report = insertReportSchema.parse({ ...req.body, userId, userEmail, deviceInfo });
      const created = await storage.createReport(report);

      // Send email notification async (non-blocking)
      setImmediate(async () => {
        try {
          await sendReportNotification(created);
        } catch (err) {
          console.error('Error sending report email:', err);
        }
      });

      res.json(created);
    } catch (error) {
      console.error('Report submission error:', error);
      res.status(400).json({
        message: 'Invalid report data',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await storage.getUserReports(userId, limit);
      res.json(result);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ message: 'Failed to fetch reports' });
    }
  });

  // ── Payments ─────────────────────────────────────────────────────────────────
  registerPaymentRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
