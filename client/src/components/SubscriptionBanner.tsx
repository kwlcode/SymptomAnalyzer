import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, X, Star } from "lucide-react";
import { PaymentModal } from "./PaymentModal";

export function SubscriptionBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: subscription } = useQuery({
    queryKey: ['/api/subscription'],
  });

  // Don't show if user has active subscription or banner is dismissed
  if (!isVisible || ((subscription as any)?.subscription?.status === 'active')) {
    return null;
  }

  return (
    <>
      <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white border-0 shadow-lg mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Crown className="h-5 w-5 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Upgrade to Premium</h3>
                <p className="text-purple-100 text-sm">
                  Get unlimited AI assessments, advanced insights, and premium features
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-right mr-4">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-300" />
                  <span className="text-sm font-medium">From $8/month</span>
                </div>
                <Badge className="bg-yellow-500 text-yellow-900 hover:bg-yellow-400 mt-1">
                  Popular Choice
                </Badge>
              </div>
              
              <Button
                onClick={() => setShowPaymentModal(true)}
                className="bg-white text-purple-700 hover:bg-gray-100 font-medium"
              >
                Upgrade Now
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="text-white hover:bg-white/20 p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PaymentModal 
        open={showPaymentModal} 
        onOpenChange={setShowPaymentModal} 
      />
    </>
  );
}