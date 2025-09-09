import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RotateCcw, TrendingUp, HelpCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { calculateRiskAssessment } from "@/lib/diagnostic-algorithm";
import ResultsDisplay from "./results-display";
import type { Category } from "@shared/schema";

export default function AssessmentForm() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [scores, setScores] = useState<number[]>([1, 1, 1, 1, 1]);
  const [showResults, setShowResults] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);

  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: any) => {
      const response = await apiRequest("POST", "/api/assessments", assessmentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
    },
  });

  const aiAnalysisMutation = useMutation({
    mutationFn: async ({ scores, categories }: { scores: number[], categories: Category[] }) => {
      const response = await apiRequest("POST", "/api/analyze", { scores, categories });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Analysis failed');
      }
      const result = await response.json();
      console.log("AI mutation result:", result);
      return result;
    },
    onError: (error: Error) => {
      if (error.message.includes('assessment limit')) {
        toast({
          title: "Assessment Limit Reached",
          description: "You've used all your free assessments this month. Upgrade to Premium for unlimited access.",
          variant: "destructive",
        });
      } else if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Analysis Failed",
          description: error.message || "Unable to complete the assessment analysis.",
          variant: "destructive",
        });
      }
    },
  });

  const handleScoreChange = (index: number, value: number) => {
    const newScores = [...scores];
    newScores[index] = value;
    setScores(newScores);
  };

  const getSliderBackground = (value: number, maxValue: number = 10) => {
    const percentage = ((value - 1) / (maxValue - 1)) * 100;
    return `linear-gradient(to right, hsl(213, 94%, 68%) 0%, hsl(213, 94%, 68%) ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`;
  };

  const getMaxValueForScoreType = (scoreType: string) => {
    switch (scoreType) {
      case "1-5": return 5;
      case "0-100": return 100;
      case "0-1": return 1;
      default: return 10;
    }
  };

  const getMinValueForScoreType = (scoreType: string) => {
    switch (scoreType) {
      case "0-100": return 0;
      case "0-1": return 0;
      default: return 1;
    }
  };

  const completedScores = scores.filter((score, index) => {
    const category = categories?.[index];
    if (!category) return false;
    const minValue = getMinValueForScoreType(category.scoreType);
    return score > minValue;
  }).length;

  const progress = categories ? (completedScores / categories.length) * 100 : 0;
  const isFormComplete = categories && completedScores === categories.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormComplete || !categories) {
      toast({
        title: "Incomplete Assessment",
        description: "Please complete all score categories",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use AI-powered analysis
      const result = await aiAnalysisMutation.mutateAsync({ scores, categories });
      console.log("AI Analysis Result:", result);
      setAssessmentResult(result);
      setShowResults(true);

      // Save assessment to backend with proper field mapping
      const assessmentData = {
        scores: scores,
        totalScore: result.totalScore || 0,
        riskLevel: result.riskLevel || "Unknown",
        explanation: result.explanation || "No analysis available",
        recommendations: result.recommendations || [],
        aiInsights: result.aiInsights || null,
        confidence: result.confidence || null,
      };
      
      console.log("Assessment data to save:", assessmentData);
      createAssessmentMutation.mutate(assessmentData);

      toast({
        title: "Analysis Complete",
        description: "AI-powered diagnostic analysis generated successfully",
      });
    } catch (error) {
      // Fallback to local analysis if AI fails
      const fallbackResult = calculateRiskAssessment(scores, categories);
      setAssessmentResult({
        ...fallbackResult,
        aiInsights: "Analysis performed using local algorithm due to AI service unavailability.",
        confidence: 70
      });
      setShowResults(true);

      const fallbackAssessmentData = {
        scores: scores,
        totalScore: fallbackResult.totalScore || 0,
        riskLevel: fallbackResult.riskLevel || "Unknown",
        explanation: fallbackResult.explanation || "No analysis available",
        recommendations: fallbackResult.recommendations || [],
        aiInsights: fallbackResult.aiInsights || null,
        confidence: fallbackResult.confidence || null,
      };
      
      createAssessmentMutation.mutate(fallbackAssessmentData);

      toast({
        title: "Analysis Complete",
        description: "Diagnostic analysis completed using backup algorithm",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    const resetScores = categories?.map(category => getMinValueForScoreType(category.scoreType)) || [1, 1, 1, 1, 1];
    setScores(resetScores);
    setShowResults(false);
    setAssessmentResult(null);
  };

  const handleNewAssessment = () => {
    handleReset();
    setShowResults(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">No assessment categories configured. Please visit the settings page to configure categories.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="bg-gradient-to-r from-primary to-blue-600 text-white rounded-t-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Patient Assessment</CardTitle>
              <p className="text-blue-100 mt-1">Please provide scores for all {categories.length} categories below</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 border-white font-medium shadow-sm flex-shrink-0"
                >
                  <HelpCircle className="h-4 w-4" />
                  How to Use
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>How to Use the Diagnostic Assessment Tool</DialogTitle>
                  <DialogDescription>
                    Follow these steps to complete your medical assessment
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-base mb-2">Step 1: Understand the Categories</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Each category represents a different aspect of your symptoms. Read the description carefully before rating.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-base mb-2">Step 2: Rate Your Symptoms</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Use the sliders to rate each category on a scale of 1-10:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-300">
                      <li><strong>1-3:</strong> Mild or minimal symptoms</li>
                      <li><strong>4-6:</strong> Moderate symptoms that may affect daily life</li>
                      <li><strong>7-8:</strong> Significant symptoms requiring attention</li>
                      <li><strong>9-10:</strong> Severe symptoms that greatly impact your life</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-base mb-2">Step 3: Submit for Analysis</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Once you've rated all categories, click "Submit Assessment" to receive AI-powered diagnostic analysis with personalized recommendations.
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      <strong>Important:</strong> This tool provides general guidance only. For medical decisions and emergencies, always consult with a qualified healthcare professional.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Assessment Progress</span>
            <span>{completedScores}/{categories.length} completed</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-8">
              {categories.map((category, index) => {
                const maxValue = getMaxValueForScoreType(category.scoreType);
                const minValue = getMinValueForScoreType(category.scoreType);
                const currentScore = scores[index] || minValue;

                return (
                  <div key={category.id} className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <label className="block text-lg font-medium text-gray-900">
                          {category.name}
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          {category.description}
                        </p>
                      </div>
                      <span className="ml-4 px-3 py-1 bg-gray-100 rounded-lg text-lg font-semibold text-gray-700 min-w-[3rem] text-center">
                        {currentScore === minValue ? '-' : currentScore}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={minValue}
                        max={maxValue}
                        value={currentScore}
                        onChange={(e) => handleScoreChange(index, parseInt(e.target.value))}
                        className="score-slider w-full"
                        style={{ background: getSliderBackground(currentScore, maxValue) }}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{minValue} - {category.scoreType.includes("1-") ? "Minimal" : "None"}</span>
                        <span>{Math.floor(maxValue / 2)} - Moderate</span>
                        <span>{maxValue} - {category.scoreType.includes("1-") ? "Severe" : "Maximum"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleReset}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Form
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={!isFormComplete || createAssessmentMutation.isPending || aiAnalysisMutation.isPending}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  {aiAnalysisMutation.isPending ? "Analyzing with AI..." : "Analyze Results"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {showResults && assessmentResult && (
        <ResultsDisplay 
          result={assessmentResult}
          scores={scores}
          categories={categories}
          onNewAssessment={handleNewAssessment}
        />
      )}
    </div>
  );
}
