export interface Category {
  id: number;
  name: string;
  description: string;
  scoreType: string;
  order: number;
}

export interface Assessment {
  id: number;
  scores: number[];
  totalScore: number;
  riskLevel: string;
  explanation: string;
  recommendations: string[];
  aiInsights?: string | null;
  confidence?: number | null;
  createdAt: Date;
}

export interface RiskAssessment {
  totalScore: number;
  riskLevel: string;
  riskPercentage: number;
  riskColor: string;
  explanation: string;
  recommendations: string[];
  aiInsights?: string;
  confidence?: number;
}

export type InsertCategory = Omit<Category, 'id'>;
export type InsertAssessment = Omit<Assessment, 'id' | 'createdAt'>;