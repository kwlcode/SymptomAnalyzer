import { db } from "./db";
import { users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface UsageLimits {
  maxAssessments: number;
  hasAiInsights: boolean;
  hasExportFeature: boolean;
  hasHistoryAccess: boolean;
  hasCustomCategories: boolean;
  hasPrioritySupport: boolean;
}

export interface UserUsage {
  assessmentCount: number;
  canUseAssessment: boolean;
  remainingAssessments: number;
  isSubscribed: boolean;
  limits: UsageLimits;
}

// Free tier limits
const FREE_TIER_LIMITS: UsageLimits = {
  maxAssessments: 2,
  hasAiInsights: false,
  hasExportFeature: false,
  hasHistoryAccess: false,
  hasCustomCategories: false,
  hasPrioritySupport: false,
};

// Premium tier limits
const PREMIUM_TIER_LIMITS: UsageLimits = {
  maxAssessments: -1, // unlimited
  hasAiInsights: true,
  hasExportFeature: true,
  hasHistoryAccess: true,
  hasCustomCategories: true,
  hasPrioritySupport: true,
};

export class FreemiumService {
  // Check user's current usage and limits
  async getUserUsage(userId: string, isSubscribed: boolean = false): Promise<UserUsage> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      throw new Error("User not found");
    }

    // Reset assessment count if it's been more than 30 days since last reset
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (user.lastAssessmentReset && user.lastAssessmentReset < thirtyDaysAgo) {
      await this.resetAssessmentCount(userId);
      user.assessmentCount = 0;
    }

    const limits = isSubscribed ? PREMIUM_TIER_LIMITS : FREE_TIER_LIMITS;
    const assessmentCount = user.assessmentCount || 0;
    const maxAssessments = limits.maxAssessments;
    const canUseAssessment = isSubscribed || maxAssessments === -1 || assessmentCount < maxAssessments;
    const remainingAssessments = isSubscribed || maxAssessments === -1 ? -1 : Math.max(0, maxAssessments - assessmentCount);

    return {
      assessmentCount,
      canUseAssessment,
      remainingAssessments,
      isSubscribed,
      limits,
    };
  }

  // Increment user's assessment count
  async incrementAssessmentCount(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        assessmentCount: sql`${users.assessmentCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Reset assessment count (used for monthly reset)
  async resetAssessmentCount(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        assessmentCount: 0,
        lastAssessmentReset: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Check if user can perform a specific action
  canPerformAction(usage: UserUsage, action: keyof UsageLimits): boolean {
    return usage.limits[action] === true;
  }

  // Get upgrade message for specific feature
  getUpgradeMessage(feature: string): string {
    const messages: Record<string, string> = {
      assessment: "You've reached your free assessment limit (2 per month). Upgrade to Premium for unlimited assessments.",
      aiInsights: "AI-powered insights are only available with Premium subscription. Upgrade to get detailed AI analysis.",
      export: "Export to PDF is a Premium feature. Upgrade to save and share your assessment reports.",
      history: "Assessment history is only available with Premium subscription. Upgrade to track your health journey.",
      categories: "Custom assessment categories are a Premium feature. Upgrade to personalize your assessments.",
      support: "Priority support is available for Premium subscribers. Upgrade for faster assistance.",
    };
    return messages[feature] || "This feature requires a Premium subscription.";
  }
}

export const freemiumService = new FreemiumService();