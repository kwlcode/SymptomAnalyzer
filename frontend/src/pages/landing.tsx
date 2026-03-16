import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Brain, Shield, Users } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function Landing() {
  const [_, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Diagnostic Assessment Tool
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            AI-powered medical assessments for healthcare professionals. Analyze symptoms, assess risk levels, and get personalized recommendations.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <Button 
              onClick={() => setLocation('/auth')}
              size="lg"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              Get Started
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center">
            <CardHeader>
              <Brain className="mx-auto h-8 w-8 text-blue-600" />
              <CardTitle className="text-lg">AI-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Advanced AI analysis using GPT-4o for accurate diagnostic insights
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Activity className="mx-auto h-8 w-8 text-green-600" />
              <CardTitle className="text-lg">Real-time Results</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get instant risk assessments and personalized recommendations
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="mx-auto h-8 w-8 text-purple-600" />
              <CardTitle className="text-lg">Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your data is protected with enterprise-grade security
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="mx-auto h-8 w-8 text-orange-600" />
              <CardTitle className="text-lg">User-Specific</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Personalized categories and assessment history for each user
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Ready to get started?</h2>
          <p className="mt-4 text-lg text-gray-600">
            Join healthcare professionals using our diagnostic assessment tool
          </p>
          <Button 
            onClick={() => setLocation('/auth')}
            size="lg"
            className="mt-6 bg-blue-600 hover:bg-blue-700 font-medium"
          >
            Sign In / Register
          </Button>
        </div>
      </div>
    </div>
  );
}