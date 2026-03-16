import { useUser, useAuth as useClerkAuth } from "@clerk/react";

export function useAuth() {
  const { isLoaded, isSignedIn, userId } = useClerkAuth();
  const { user } = useUser();

  return {
    user,
    userId,
    isLoading: !isLoaded,
    isAuthenticated: isSignedIn,
  };
}