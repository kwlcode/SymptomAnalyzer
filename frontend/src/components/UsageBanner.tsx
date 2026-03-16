import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star, AlertTriangle, Zap } from 'lucide-react';

interface UsageInfo {
  assessmentCount: number;
  canUseAssessment: boolean;
  remainingAssessments: number;
  isSubscribed: boolean;
  limits: {
    maxAssessments: number;
    hasAiInsights: boolean;
    hasExportFeature: boolean;
    hasHistoryAccess: boolean;
    hasCustomCategories: boolean;
    hasPrioritySupport: boolean;
  };
}

interface UsageBannerProps {
  onUpgradeClick: () => void;
}

export function UsageBanner({ onUpgradeClick }: UsageBannerProps) {
  const { data: usage } = useQuery<UsageInfo>({
    queryKey: ['/api/usage'],
    retry: false,
  });

  if (!usage || usage.isSubscribed) {
    return null;
  }

  const progressPercentage = usage.limits.maxAssessments > 0 
    ? (usage.assessmentCount / usage.limits.maxAssessments) * 100 
    : 0;

  const isNearLimit = usage.remainingAssessments <= 1;
  const hasReachedLimit = !usage.canUseAssessment;

  if (hasReachedLimit) {
    return (
      <Alert className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-medium text-orange-800 dark:text-orange-200">
              Assessment limit reached
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              You've used all {usage.limits.maxAssessments} free assessments this month. Upgrade for unlimited access.
            </p>
          </div>
          <Button onClick={onUpgradeClick} className="ml-4">
            <Star className="h-4 w-4 mr-2" />
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950">
      <Zap className="h-4 w-4 text-blue-600" />
      <AlertDescription>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">
              Free Plan - {usage.remainingAssessments} assessment{usage.remainingAssessments !== 1 ? 's' : ''} remaining
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {isNearLimit ? 'Almost at your monthly limit!' : 'Track your health with our assessment tool'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-blue-700 dark:text-blue-300">
              {usage.assessmentCount}/{usage.limits.maxAssessments} used
            </Badge>
            <Button onClick={onUpgradeClick} variant="outline" size="sm">
              <Star className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-blue-700 dark:text-blue-300">Monthly usage</span>
            <span className="text-blue-700 dark:text-blue-300">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
        </div>
      </AlertDescription>
    </Alert>
  );
}