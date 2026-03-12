"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserManager } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const userManager = getUserManager();

        // Process the callback - this exchanges the code for tokens
        const user = await userManager.signinRedirectCallback();

        if (user) {
          // Successfully authenticated, redirect to dashboard
          router.replace("/dashboard");
        } else {
          setError("Authentication failed - no user returned");
        }
      } catch (err) {
        console.error("Auth callback error:", err);

        // Check if it's a specific error type
        const errorMessage = err instanceof Error ? err.message : "Authentication failed";

        // If it's a state mismatch or expired state, redirect to login
        if (errorMessage.includes("state") || errorMessage.includes("expired")) {
          router.replace("/login");
          return;
        }

        setError(errorMessage);
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center max-w-md px-4">
          <div className="mb-4 text-red-500">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mb-4">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
