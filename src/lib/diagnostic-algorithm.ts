import type { Category } from "@shared/schema";

export interface RiskAssessment {
  totalScore: number;
  riskLevel: string;
  riskPercentage: number;
  riskColor: string;
  explanation: string;
  recommendations: string[];
}

export function calculateRiskAssessment(scores: number[], categories: Category[]): RiskAssessment {
  // Normalize scores to a common scale (1-10) for calculation
  const normalizedScores = scores.map((score, index) => {
    const category = categories[index];
    if (!category) return score;
    
    const maxValue = getMaxValueForScoreType(category.scoreType);
    const minValue = getMinValueForScoreType(category.scoreType);
    
    // Normalize to 1-10 scale
    return ((score - minValue) / (maxValue - minValue)) * 9 + 1;
  });

  const totalScore = normalizedScores.reduce((sum, score) => sum + score, 0);
  
  // Apply weighted scoring (can be made configurable)
  const weights = [1.5, 1.0, 1.2, 1.0, 0.8]; // Severity, Impact, Duration, Frequency, Factors
  const weightedScore = normalizedScores.reduce((sum, score, index) => {
    const weight = weights[index] || 1.0;
    return sum + (score * weight);
  }, 0);

  // Determine risk level based on weighted score
  let riskLevel: string;
  let riskColor: string;
  let riskPercentage: number;
  let explanation: string;
  let recommendations: string[];

  if (weightedScore <= 15) {
    riskLevel = "Low Risk";
    riskColor = "#059669";
    riskPercentage = 25;
    explanation = "The assessment indicates a low risk profile. Symptoms appear mild and manageable. Continue monitoring and maintain current care practices.";
    recommendations = [
      "Continue regular self-monitoring",
      "Maintain healthy lifestyle practices",
      "Schedule routine follow-up if symptoms persist"
    ];
  } else if (weightedScore <= 30) {
    riskLevel = "Moderate Risk";
    riskColor = "#d97706";
    riskPercentage = 60;
    explanation = "Based on your scores, the assessment indicates a moderate risk profile. The combination of symptoms suggests monitoring and possible intervention may be beneficial.";
    recommendations = [
      "Schedule follow-up assessment within 2-4 weeks",
      "Monitor symptoms and track changes",
      "Consider lifestyle modifications",
      "Discuss results with healthcare provider"
    ];
  } else {
    riskLevel = "High Risk";
    riskColor = "#dc2626";
    riskPercentage = 90;
    explanation = "The assessment indicates a high risk profile. The combination and severity of symptoms warrant immediate attention and comprehensive evaluation.";
    recommendations = [
      "Seek immediate medical consultation",
      "Document all symptoms and changes",
      "Consider urgent care if symptoms worsen",
      "Follow up within 1-2 weeks",
      "Implement immediate safety measures"
    ];
  }

  return {
    totalScore: Math.round(totalScore),
    riskLevel,
    riskPercentage,
    riskColor,
    explanation,
    recommendations
  };
}

function getMaxValueForScoreType(scoreType: string): number {
  switch (scoreType) {
    case "1-5": return 5;
    case "0-100": return 100;
    case "0-1": return 1;
    default: return 10;
  }
}

function getMinValueForScoreType(scoreType: string): number {
  switch (scoreType) {
    case "0-100": return 0;
    case "0-1": return 0;
    default: return 1;
  }
}
