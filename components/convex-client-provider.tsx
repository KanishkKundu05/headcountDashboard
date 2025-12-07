"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useEffect } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Component to clean OAuth params from URL after callback
function OAuthParamCleaner() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      // Check for OAuth callback params
      if (url.searchParams.has("code") || url.searchParams.has("state")) {
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        // Use replaceState to clean URL without triggering navigation
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

  return null;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      <OAuthParamCleaner />
      {children}
    </ConvexAuthProvider>
  );
}
