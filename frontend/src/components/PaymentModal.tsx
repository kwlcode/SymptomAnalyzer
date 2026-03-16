import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Star, Crown, Check, CreditCard } from 'lucide-react';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  paymentLink: string;
}

// Currency exchange rates relative to USD
const currencyRates: Record<string, number> = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.75,
  CAD: 1.35,
  AUD: 1.50,
  JPY: 110.0,
  ZAR: 18.5,
  NGN: 800.0,
  INR: 82.0,
  BRL: 5.2
};

const getCurrencyPrice = (baseUsdPrice: number, currency: string): number => {
  const rate = currencyRates[currency] || 1.0;
  return Math.round((baseUsdPrice * rate) * 100) / 100;
};

const getSubscriptionPlans = (currency: string): SubscriptionPlan[] => [
  {
    id: 'premium',
    name: 'Premium',
    price: getCurrencyPrice(8, currency),
    currency,
    duration: 'monthly',
    features: [
      'Unlimited AI assessments',
      'Advanced diagnostic insights',
      'Priority support',
      'Export reports to PDF',
      'Assessment history tracking'
    ],
    icon: <Star className="h-5 w-5" />,
    popular: true,
    paymentLink: 'https://paystack.shop/pay/kracqagx3-'
  },
  {
    id: 'professional',
    name: 'Professional',
    price: getCurrencyPrice(90, currency),
    currency, 
    duration: 'yearly',
    features: [
      'Everything in Premium',
      'Custom assessment categories',
      'Team collaboration',
      'API access',
      'White-label branding',
      'Advanced analytics'
    ],
    icon: <Crown className="h-5 w-5" />,
    paymentLink: 'https://paystack.shop/pay/ku5-fvg80v'
  }
];

export function PaymentModal({ open, onOpenChange }: PaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentSubscription } = useQuery<{
    subscription?: {
      plan: string;
      status: string;
    }
  }>({
    queryKey: ['/api/subscription'],
    enabled: open,
  });

  const handlePayment = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan.id);
    
    // Open Paystack payment link directly
    window.open(plan.paymentLink, '_blank');
    onOpenChange(false);
    
    toast({
      title: "Payment Link Opened",
      description: `Please complete your ${plan.name} subscription payment in the new tab.`,
    });
  };

  const formatPrice = (price: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(price);
    } catch (e) {
      return `${price} ${currency}`;
    }
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.subscription?.plan === planId && 
           currentSubscription?.subscription?.status === 'active';
  };

  const subscriptionPlans = getSubscriptionPlans(selectedCurrency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Choose Your Plan
          </DialogTitle>
          <p className="text-muted-foreground text-center">
            Select your preferred currency and subscription plan
          </p>
        </DialogHeader>

        {currentSubscription?.subscription && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Plan</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {currentSubscription.subscription.plan} - {currentSubscription.subscription.status}
                </p>
              </div>
              <Badge variant={currentSubscription.subscription.status === 'active' ? 'default' : 'secondary'}>
                {currentSubscription.subscription.status}
              </Badge>
            </div>
          </div>
        )}

        {/* Currency Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Currency</label>
          <select 
            value={selectedCurrency} 
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="w-full p-3 border rounded-md bg-background"
          >
            <option value="USD">🇺🇸 USD - US Dollar</option>
            <option value="EUR">🇪🇺 EUR - Euro</option>
            <option value="GBP">🇬🇧 GBP - British Pound</option>
            <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
            <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
            <option value="ZAR">🇿🇦 ZAR - South African Rand</option>
            <option value="NGN">🇳🇬 NGN - Nigerian Naira</option>
            <option value="INR">🇮🇳 INR - Indian Rupee</option>
            <option value="BRL">🇧🇷 BRL - Brazilian Real</option>
            <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
          </select>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative border rounded-lg p-6 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              } ${plan.popular ? 'ring-2 ring-primary/20' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {plan.icon}
                  <h3 className="font-semibold">{plan.name}</h3>
                </div>
                {isCurrentPlan(plan.id) && (
                  <Badge variant="outline" className="text-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    Current
                  </Badge>
                )}
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold">
                  {formatPrice(plan.price, plan.currency)}
                </span>
                <span className="text-muted-foreground">/{plan.duration}</span>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={selectedPlan === plan.id ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePayment(plan);
                }}
                disabled={isCurrentPlan(plan.id)}
              >
                {isCurrentPlan(plan.id) ? (
                  'Current Plan'
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Subscribe to {plan.name}
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Multi-Currency Support</h4>
          <p className="text-sm text-muted-foreground">
            Choose your preferred currency above. Payments are processed securely by Paystack with support for 10+ currencies including USD, EUR, GBP, ZAR, and more.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <strong>Current pricing:</strong> Premium {formatPrice(getCurrencyPrice(8, selectedCurrency), selectedCurrency)}/month, Professional {formatPrice(getCurrencyPrice(90, selectedCurrency), selectedCurrency)}/year
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}