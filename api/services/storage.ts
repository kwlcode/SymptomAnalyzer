import { users, categories, assessments, reports, payments, subscriptions } from "../db/tables";
import type { User, UpsertUser, Category, InsertCategory, UpdateCategory, Assessment, InsertAssessment, Report, InsertReport, Payment, InsertPayment, Subscription, InsertSubscription } from "../db/tables";
import { db } from "../db/client";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Categories
  getCategories(userId: string): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: UpdateCategory): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  resetCategoriesToDefaults(): Promise<Category[]>;
  
  // Assessments
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getRecentAssessments(userId: string, limit?: number): Promise<Assessment[]>;
  
  // Reports
  createReport(report: InsertReport): Promise<Report>;
  getReports(limit?: number): Promise<Report[]>;
  getUserReports(userId: string, limit?: number): Promise<Report[]>;
  
  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(reference: string, data: Partial<Payment>): Promise<Payment>;
  getPayment(reference: string): Promise<Payment | undefined>;
  getUserPayments(userId: string, limit?: number): Promise<Payment[]>;
  
  // Subscriptions
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription>;
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  getActiveSubscriptions(): Promise<Subscription[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private categories: Map<number, Category>;
  private assessments: Map<number, Assessment>;
  private reports: Map<number, Report>;
  private payments: Map<number, Payment>;
  private subscriptions: Map<number, Subscription>;
  private categoryCurrentId: number;
  private assessmentCurrentId: number;
  private reportCurrentId: number;
  private paymentCurrentId: number;
  private subscriptionCurrentId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.assessments = new Map();
    this.reports = new Map();
    this.payments = new Map();
    this.subscriptions = new Map();
    this.categoryCurrentId = 1;
    this.assessmentCurrentId = 1;
    this.reportCurrentId = 1;
    this.paymentCurrentId = 1;
    this.subscriptionCurrentId = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      id: userData.id!,
      email: userData.email || null,
      passwordHash: userData.passwordHash || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      assessmentCount: 0,
      lastAssessmentReset: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getCategories(userId: string): Promise<Category[]> {
    const userCategories = Array.from(this.categories.values())
      .filter(cat => cat.userId === userId)
      .sort((a, b) => a.order - b.order);
    
    // Initialize with default categories if empty
    if (userCategories.length === 0) {
      return await this.resetCategoriesToDefaults();
    }
    
    return userCategories;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryCurrentId++;
    const category: Category = { 
      id,
      name: insertCategory.name,
      description: insertCategory.description,
      scoreType: insertCategory.scoreType,
      order: insertCategory.order,
      userId: insertCategory.userId!,
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, updateCategory: UpdateCategory): Promise<Category> {
    const existing = this.categories.get(id);
    if (!existing) {
      throw new Error("Category not found");
    }
    const updated: Category = { ...existing, ...updateCategory };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    this.categories.delete(id);
  }

  async resetCategoriesToDefaults(): Promise<Category[]> {
    const userId = "user"; // This will be overridden by specific implementation
    // Remove user's existing categories
    const entriesToDelete: number[] = [];
    this.categories.forEach((category, id) => {
      if (category.userId === userId) {
        entriesToDelete.push(id);
      }
    });
    entriesToDelete.forEach(id => this.categories.delete(id));
    
    // Add default categories for this user
    const defaultCategories = [
      { name: "Symptom Severity", description: "Rate the intensity of primary symptoms", scoreType: "1-10", order: 1, userId },
      { name: "Functional Impact", description: "How much symptoms affect daily activities", scoreType: "1-10", order: 2, userId },
      { name: "Duration", description: "How long have symptoms been present?", scoreType: "1-10", order: 3, userId },
      { name: "Frequency", description: "How often do symptoms occur?", scoreType: "1-10", order: 4, userId },
      { name: "Associated Factors", description: "Presence of related symptoms or risk factors", scoreType: "1-10", order: 5, userId },
    ];

    defaultCategories.forEach((cat) => {
      const categoryWithId: Category = { 
        id: this.categoryCurrentId++, 
        name: cat.name,
        description: cat.description,
        scoreType: cat.scoreType,
        order: cat.order,
        userId: cat.userId,
      };
      this.categories.set(categoryWithId.id, categoryWithId);
    });
    
    return this.getCategories(userId);
  }

  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const id = this.assessmentCurrentId++;
    const assessment: Assessment = {
      id,
      scores: insertAssessment.scores,
      totalScore: insertAssessment.totalScore,
      riskLevel: insertAssessment.riskLevel,
      explanation: insertAssessment.explanation,
      recommendations: insertAssessment.recommendations,
      aiInsights: insertAssessment.aiInsights || null,
      confidence: insertAssessment.confidence || null,
      userId: insertAssessment.userId,
      createdAt: new Date(),
    };
    this.assessments.set(id, assessment);
    return assessment;
  }

  async getRecentAssessments(userId: string, limit: number = 10): Promise<Assessment[]> {
    return Array.from(this.assessments.values())
      .filter(assessment => assessment.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.reportCurrentId++;
    const report: Report = {
      id,
      reportType: insertReport.reportType,
      title: insertReport.title,
      description: insertReport.description,
      category: insertReport.category || null,
      priority: insertReport.priority || "medium",
      status: "open",
      userId: insertReport.userId,
      userEmail: insertReport.userEmail || null,
      relatedItemId: insertReport.relatedItemId || null,
      deviceInfo: insertReport.deviceInfo || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.reports.set(id, report);
    return report;
  }

  async getReports(limit: number = 50): Promise<Report[]> {
    return Array.from(this.reports.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async getUserReports(userId: string, limit: number = 10): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(report => report.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  // Payment methods for MemStorage
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.getNextPaymentId();
    const newPayment: Payment = {
      id,
      ...payment,
      paystackId: payment.paystackId || null,
      channel: payment.channel || null,
      gatewayResponse: payment.gatewayResponse || null,
      paidAt: payment.paidAt || null,
      currency: payment.currency || 'USD',
      metadata: payment.metadata || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.payments.set(id, newPayment);
    return newPayment;
  }

  async updatePayment(reference: string, data: Partial<Payment>): Promise<Payment> {
    const payment = Array.from(this.payments.values()).find(p => p.reference === reference);
    if (!payment) {
      throw new Error('Payment not found');
    }
    const updated = { ...payment, ...data, updatedAt: new Date() };
    this.payments.set(payment.id, updated);
    return updated;
  }

  async getPayment(reference: string): Promise<Payment | undefined> {
    return Array.from(this.payments.values()).find(p => p.reference === reference);
  }

  async getUserPayments(userId: string, limit: number = 20): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  // Subscription methods for MemStorage
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const id = this.getNextSubscriptionId();
    const newSubscription: Subscription = {
      id,
      ...subscription,
      startDate: subscription.startDate || new Date(),
      paymentReference: subscription.paymentReference || null,
      currency: subscription.currency || 'USD',
      autoRenew: subscription.autoRenew ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.subscriptions.set(id, newSubscription);
    return newSubscription;
  }

  async updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    const updated = { ...subscription, ...data, updatedAt: new Date() };
    this.subscriptions.set(id, updated);
    return updated;
  }

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(s => s.userId === userId);
  }

  async getActiveSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(s => s.status === 'active');
  }

  private getNextPaymentId(): number {
    return ++this.paymentCurrentId;
  }

  private getNextSubscriptionId(): number {
    return ++this.subscriptionCurrentId;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getCategories(userId: string): Promise<Category[]> {
    console.log(`[Storage] Fetching categories for user: ${userId}`);
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(categories.order);
    
    console.log(`[Storage] Found ${result.length} categories for user: ${userId}`);
    
    // Initialize with default categories if empty
    if (result.length === 0) {
      console.log(`[Storage] Seeding default categories for user: ${userId}`);
      // Create default categories for this user
      const defaultCategories = [
        { name: "Symptom Severity", description: "Rate the intensity of primary symptoms", scoreType: "1-10", order: 1, userId },
        { name: "Functional Impact", description: "How much symptoms affect daily activities", scoreType: "1-10", order: 2, userId },
        { name: "Duration", description: "How long have symptoms been present?", scoreType: "1-10", order: 3, userId },
        { name: "Frequency", description: "How often do symptoms occur?", scoreType: "1-10", order: 4, userId },
        { name: "Associated Factors", description: "Presence of related symptoms or risk factors", scoreType: "1-10", order: 5, userId },
      ];
      
      const insertedCategories = await db.insert(categories).values(defaultCategories).returning();
      return insertedCategories;
    }
    
    return result;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateCategory(id: number, updateCategory: UpdateCategory): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set(updateCategory)
      .where(eq(categories.id, id))
      .returning();
    
    if (!category) {
      throw new Error("Category not found");
    }
    
    return category;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async resetCategoriesToDefaults(): Promise<Category[]> {
    // This method is not used in DatabaseStorage - reset is handled in routes
    return [];
  }

  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const [assessment] = await db
      .insert(assessments)
      .values(insertAssessment)
      .returning();
    return assessment;
  }

  async getRecentAssessments(userId: string, limit: number = 10): Promise<Assessment[]> {
    return await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.createdAt))
      .limit(limit);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values(insertReport)
      .returning();
    return report;
  }

  async getReports(limit: number = 50): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .orderBy(desc(reports.createdAt))
      .limit(limit);
  }

  async getUserReports(userId: string, limit: number = 10): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.createdAt))
      .limit(limit);
  }

  // Payment methods for DatabaseStorage
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async updatePayment(reference: string, data: Partial<Payment>): Promise<Payment> {
    const [payment] = await db
      .update(payments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(payments.reference, reference))
      .returning();
    
    if (!payment) {
      throw new Error("Payment not found");
    }
    
    return payment;
  }

  async getPayment(reference: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.reference, reference));
    return payment;
  }

  async getUserPayments(userId: string, limit: number = 20): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt))
      .limit(limit);
  }

  // Subscription methods for DatabaseStorage
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    
    if (!subscription) {
      throw new Error("Subscription not found");
    }
    
    return subscription;
  }

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return subscription;
  }

  async getActiveSubscriptions(): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));
  }
}

export const storage = new DatabaseStorage();