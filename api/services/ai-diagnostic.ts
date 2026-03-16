import { env } from '../env';
import OpenAI from "openai";
import type { Category } from "../db/tables";

// Lazy-loaded OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!openai) {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is missing. Please add it to your .env file.");
    }
    openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return openai;
}

export interface AIRiskAssessment {
  totalScore: number;
  riskLevel: string;
  riskPercentage: number;
  riskColor: string;
  explanation: string;
  recommendations: string[];
  aiInsights?: string;
  confidence: number;
}

export async function generateAIDiagnosticAnalysis(
  scores: number[], 
  categories: Category[],
  includeAiInsights: boolean = true
): Promise<AIRiskAssessment> {
  try {
    const prompt = `You are a medical AI assistant analyzing patient assessment scores. Provide a comprehensive diagnostic analysis.

Assessment Data:
${categories.map((cat, index) => `${cat.name}: ${scores[index]} (${cat.scoreType} scale) - ${cat.description}`).join('\n')}

Please analyze these scores and provide:
1. Risk level (Low Risk, Moderate Risk, High Risk, or Critical Risk)
2. Risk percentage (0-100)
3. Detailed explanation of the assessment
4. Specific medical recommendations
5. Confidence level in the assessment (0-100)
6. Additional clinical insights

Respond in JSON format with this structure:
{
  "riskLevel": "string",
  "riskPercentage": number,
  "explanation": "string",
  "recommendations": ["string array"],
  "aiInsights": "string",
  "confidence": number
}

Important: Base your analysis on established medical principles. If scores indicate serious conditions, recommend immediate medical attention.`;

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a medical AI assistant providing diagnostic analysis. Always prioritize patient safety and recommend professional medical consultation when appropriate. Provide evidence-based assessments."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent medical advice
      max_tokens: 1000
    });

    const aiResult = JSON.parse(response.choices[0].message.content || "{}");
    console.log("Parsed AI result:", aiResult);
    
    // Calculate total score and determine risk color
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const riskColor = getRiskColor(aiResult.riskLevel);

    const finalResult = {
      totalScore: Math.round(totalScore),
      riskLevel: aiResult.riskLevel || "Unknown",
      riskPercentage: Math.min(100, Math.max(0, aiResult.riskPercentage || 0)),
      riskColor,
      explanation: aiResult.explanation || "Unable to generate analysis",
      recommendations: Array.isArray(aiResult.recommendations) ? aiResult.recommendations : ["Consult with a healthcare professional"],
      aiInsights: includeAiInsights ? (aiResult.aiInsights || "No additional insights available") : "Upgrade to Premium for AI-powered insights and detailed analysis",
      confidence: Math.min(100, Math.max(0, aiResult.confidence || 50))
    };

    console.log("Final AI result to return:", finalResult);
    return finalResult;

  } catch (error) {
    console.error("AI diagnostic analysis failed:", error);
    
    // Fallback to basic analysis if AI fails
    return generateFallbackAnalysis(scores, categories);
  }
}

function getRiskColor(riskLevel: string): string {
  switch (riskLevel?.toLowerCase()) {
    case "low risk":
      return "#059669";
    case "moderate risk":
      return "#d97706";
    case "high risk":
      return "#dc2626";
    case "critical risk":
      return "#7c2d12";
    default:
      return "#6b7280";
  }
}

function generateFallbackAnalysis(scores: number[], categories: Category[]): AIRiskAssessment {
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const averageScore = totalScore / scores.length;
  
  let riskLevel: string;
  let riskPercentage: number;
  let explanation: string;
  let recommendations: string[];
  
  if (averageScore <= 3) {
    riskLevel = "Low Risk";
    riskPercentage = 25;
    explanation = "Assessment indicates minimal concern. Scores suggest mild symptoms that may be manageable with routine care.";
    recommendations = ["Continue regular monitoring", "Maintain healthy lifestyle", "Schedule routine follow-up if needed"];
  } else if (averageScore <= 6) {
    riskLevel = "Moderate Risk";
    riskPercentage = 60;
    explanation = "Assessment indicates moderate concern. Scores suggest symptoms that warrant attention and possible intervention.";
    recommendations = ["Schedule medical consultation", "Monitor symptoms closely", "Consider lifestyle modifications", "Follow up within 2-4 weeks"];
  } else {
    riskLevel = "High Risk";
    riskPercentage = 85;
    explanation = "Assessment indicates significant concern. Scores suggest symptoms that require immediate medical attention.";
    recommendations = ["Seek immediate medical consultation", "Document all symptoms", "Consider urgent care if symptoms worsen", "Implement safety measures"];
  }
  
  return {
    totalScore: Math.round(totalScore),
    riskLevel,
    riskPercentage,
    riskColor: getRiskColor(riskLevel),
    explanation,
    recommendations,
    aiInsights: "Analysis performed using fallback algorithm due to AI service unavailability.",
    confidence: 70
  };
}