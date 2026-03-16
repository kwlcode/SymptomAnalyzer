import { useState } from "react";
import { SignIn, SignUp } from "@clerk/react";

export default function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">
          SymptomAnalyzer
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to your account or create a new one
        </p>
      </div>

      <div className="w-full max-w-md flex justify-center">
        {isRegistering ? (
          <div className="w-full flex flex-col items-center">
            <SignUp routing="hash" signInUrl="/auth" />
            <button 
              onClick={() => setIsRegistering(false)}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Already have an account? Sign In
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <SignIn routing="hash" signUpUrl="/auth" />
            <button 
              onClick={() => setIsRegistering(true)}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Don't have an account? Sign Up
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
