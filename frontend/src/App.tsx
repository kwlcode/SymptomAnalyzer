import { ClerkProvider, useAuth as useClerkAuth } from '@clerk/react';
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { setTokenFetcher } from "@/lib/api";
import Assessment from "@/pages/assessment";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";
import Navigation from "@/components/navigation";
import { useEffect } from 'react';

function AuthBridge() {
  const { getToken } = useClerkAuth();
  
  useEffect(() => {
    setTokenFetcher(getToken);
  }, [getToken]);

  return null;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && location === "/auth") {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Switch>
          <Route path="/" component={Assessment} />
          <Route path="/assessment" component={Assessment} />
          <Route path="/settings" component={Settings} />
          <Route path="/auth">
            {() => {
              setLocation("/");
              return null;
            }}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  if (!PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border border-red-200">
          <h2 className="text-xl font-bold text-red-600 mb-4">Configuration Error</h2>
          <p className="text-gray-700 mb-4">
            The Clerk Publishable Key is missing. Please ensure <code>VITE_CLERK_PUBLISHABLE_KEY</code> is set in your <code>.env</code> file.
          </p>
          <div className="bg-gray-100 p-3 rounded text-xs font-mono break-all">
            Expected: VITE_CLERK_PUBLISHABLE_KEY=pk_...
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AuthBridge />
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
