import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { freemiumService } from "./freemium-service";
import { insertCategorySchema, updateCategorySchema, insertAssessmentSchema, insertReportSchema, categories } from "@shared/schema";
import { generateAIDiagnosticAnalysis } from "./ai-diagnostic";
import { sendReportNotification } from "./email-service";
import { registerPaymentRoutes } from "./payment-routes";
import { db } from "./db";
import { eq } from "drizzle-orm";
import type { Category } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User usage endpoint
  app.get("/api/usage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getUserSubscription(userId);
      const isSubscribed = subscription && subscription.status === 'active';
      
      const usage = await freemiumService.getUserUsage(userId, isSubscribed);
      res.json(usage);
    } catch (error) {
      console.error("Error fetching user usage:", error);
      res.status(500).json({ message: "Failed to fetch usage information" });
    }
  });

  // Categories routes
  app.get("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Fetching categories for user:", userId);
      const categories = await storage.getCategories(userId);
      console.log("Found categories:", categories);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user can create custom categories (Premium feature)
      const subscription = await storage.getUserSubscription(userId);
      const isSubscribed = subscription && subscription.status === 'active';
      const usage = await freemiumService.getUserUsage(userId, isSubscribed);
      
      if (!freemiumService.canPerformAction(usage, 'hasCustomCategories')) {
        return res.status(403).json({ 
          message: freemiumService.getUpgradeMessage('categories'),
          feature: 'custom_categories'
        });
      }
      
      const categoryData = { ...req.body, userId };
      console.log("Creating category with data:", categoryData);
      const validatedData = insertCategorySchema.parse(categoryData);
      console.log("Validated category data:", validatedData);
      const category = await storage.createCategory(validatedData);
      console.log("Created category:", category);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        console.error("Category validation error:", validationError.toString());
        res.status(400).json({ message: "Invalid category data", error: validationError.toString() });
      } else {
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  app.put("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const categoryData = updateCategorySchema.parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: "Invalid category data", error: validationError.toString() });
      } else if (error instanceof Error && (error.message === "Category not found" || error.message === "Category not found or unauthorized")) {
        res.status(404).json({ message: "Category not found" });
      } else {
        console.error("Error updating category:", error);
        res.status(500).json({ message: "Failed to update category" });
      }
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      await storage.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  app.post("/api/categories/reset", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Resetting categories for user:", userId);
      
      // Delete existing categories for this user
      await db.delete(categories).where(eq(categories.userId, userId));
      
      // Insert default categories for this user
      const defaultCategories = [
        { name: "Symptom Severity", description: "Rate the intensity of primary symptoms", scoreType: "1-10", order: 1, userId },
        { name: "Functional Impact", description: "How much symptoms affect daily activities", scoreType: "1-10", order: 2, userId },
        { name: "Duration", description: "How long have symptoms been present?", scoreType: "1-10", order: 3, userId },
        { name: "Frequency", description: "How often do symptoms occur?", scoreType: "1-10", order: 4, userId },
        { name: "Associated Factors", description: "Presence of related symptoms or risk factors", scoreType: "1-10", order: 5, userId },
      ];
      
      const insertedCategories = await db.insert(categories).values(defaultCategories).returning();
      console.log("Reset categories result:", insertedCategories);
      res.json(insertedCategories);
    } catch (error) {
      console.error("Error resetting categories:", error);
      res.status(500).json({ message: "Failed to reset categories" });
    }
  });

  // Assessments routes
  app.post("/api/assessments", isAuthenticated, async (req: any, res) => {
    try {
      console.log("Assessment data received:", req.body);
      const userId = req.user.claims.sub;
      const assessmentWithUser = { ...req.body, userId };
      const assessment = insertAssessmentSchema.parse(assessmentWithUser);
      console.log("Assessment data validated:", assessment);
      const created = await storage.createAssessment(assessment);
      res.json(created);
    } catch (error) {
      console.error("Assessment validation error:", error);
      res.status(400).json({ 
        message: "Invalid assessment data",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // AI-powered diagnostic analysis
  app.post("/api/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { scores, categories } = req.body;
      
      if (!Array.isArray(scores) || !Array.isArray(categories)) {
        return res.status(400).json({ message: "Invalid scores or categories data" });
      }

      if (scores.length !== categories.length) {
        return res.status(400).json({ message: "Scores and categories length mismatch" });
      }

      // Check usage limits
      const subscription = await storage.getUserSubscription(userId);
      const isSubscribed = subscription && subscription.status === 'active';
      const usage = await freemiumService.getUserUsage(userId, isSubscribed);
      
      if (!usage.canUseAssessment) {
        return res.status(403).json({ 
          message: freemiumService.getUpgradeMessage('assessment'),
          feature: 'assessment_limit',
          usage: {
            current: usage.assessmentCount,
            limit: usage.limits.maxAssessments,
            remaining: usage.remainingAssessments
          }
        });
      }

      const analysis = await generateAIDiagnosticAnalysis(scores, categories, usage.limits.hasAiInsights);
      
      // Increment assessment count for free users
      if (!isSubscribed) {
        await freemiumService.incrementAssessmentCount(userId);
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ message: "Failed to generate diagnostic analysis" });
    }
  });

  app.get("/api/assessments/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const assessments = await storage.getRecentAssessments(userId, limit);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching recent assessments:", error);
      res.status(500).json({ message: "Failed to fetch recent assessments" });
    }
  });

  // Reports routes
  app.post("/api/reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;
      
      // Get device/browser info from headers
      const deviceInfo = {
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
        timestamp: new Date().toISOString()
      };
      
      const reportWithUser = { 
        ...req.body, 
        userId,
        userEmail,
        deviceInfo: JSON.stringify(deviceInfo)
      };
      
      const report = insertReportSchema.parse(reportWithUser);
      const created = await storage.createReport(report);
      
      console.log("New report created:", {
        id: created.id,
        type: created.reportType,
        title: created.title,
        userId: created.userId
      });

      // Send email notification in the background
      setImmediate(async () => {
        try {
          const emailSent = await sendReportNotification(created);
          if (emailSent) {
            console.log(`Email notification sent for report #${created.id}`);
          } else {
            console.log(`Failed to send email notification for report #${created.id}`);
          }
        } catch (error) {
          console.error("Error sending email notification:", error);
        }
      });
      
      res.json(created);
    } catch (error) {
      console.error("Report submission error:", error);
      res.status(400).json({ 
        message: "Invalid report data",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const reports = await storage.getUserReports(userId, limit);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching user reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Register payment routes
  registerPaymentRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
