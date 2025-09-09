import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  serial,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  assessmentCount: integer("assessment_count").default(0).notNull(),
  lastAssessmentReset: timestamp("last_assessment_reset").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  scoreType: varchar("score_type", { length: 20 }).notNull(),
  order: integer("order").notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
});

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  scores: integer("scores").array().notNull(),
  totalScore: integer("total_score").notNull(),
  riskLevel: varchar("risk_level", { length: 50 }).notNull(),
  explanation: text("explanation").notNull(),
  recommendations: text("recommendations").array().notNull(),
  aiInsights: text("ai_insights"),
  confidence: integer("confidence"),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reports table for user reporting/flagging system
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reportType: varchar("report_type").notNull(), // 'content', 'bug', 'feature_request', 'inappropriate', 'technical_issue'
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category"), // 'assessment', 'category', 'ai_response', 'ui', 'other'
  priority: varchar("priority").default("medium"), // 'low', 'medium', 'high', 'urgent'
  status: varchar("status").default("open"), // 'open', 'in_progress', 'resolved', 'closed'
  userId: varchar("user_id").notNull(),
  userEmail: varchar("user_email"),
  relatedItemId: varchar("related_item_id"), // ID of assessment, category, etc. if applicable
  deviceInfo: text("device_info"), // Browser, OS info for technical issues
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  assessments: many(assessments),
  reports: many(reports),
}));

export const categoriesRelations = relations(categories, ({ one }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
}));

export const assessmentsRelations = relations(assessments, ({ one }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
}));

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const updateCategorySchema = createInsertSchema(categories).omit({
  id: true,
  userId: true,
}).partial();

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Payment transactions table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  reference: varchar("reference").unique().notNull(),
  amount: integer("amount").notNull(), // Amount in cents/smallest currency unit
  currency: varchar("currency").default("USD").notNull(),
  status: varchar("status").notNull(), // pending, success, failed, abandoned
  paystackId: integer("paystack_id"),
  channel: varchar("channel"), // card, bank, ussd, qr, mobile_money, bank_transfer
  gatewayResponse: varchar("gateway_response"),
  paidAt: timestamp("paid_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// Premium subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  plan: varchar("plan").notNull(), // basic, premium, professional
  status: varchar("status").notNull(), // active, cancelled, expired, pending
  amount: integer("amount").notNull(),
  currency: varchar("currency").default("USD").notNull(),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date").notNull(),
  autoRenew: boolean("auto_renew").default(true).notNull(),
  paymentReference: varchar("payment_reference").references(() => payments.reference),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
