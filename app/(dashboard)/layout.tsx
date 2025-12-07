"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { RunwayInputs } from "@/components/RunwayInputs";
import { useRunwaySettings } from "@/components/CashRunwayVisualization";
import { useCurrentScenario } from "@/hooks/use-current-scenario";
import { api } from "@/convex/_generated/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const { currentScenarioId } = useCurrentScenario();
  const scenarioWithEmployees = useQuery(
    api.scenarios.getScenarioWithEmployees,
    currentScenarioId ? { id: currentScenarioId } : "skip"
  );
  const handleRunwayUpdate = currentScenarioId
    ? useRunwaySettings(currentScenarioId)
    : () => {};

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signup");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-[4.25rem] items-center justify-between gap-4 border-b px-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
          </div>
          <div className="ml-auto">
            <RunwayInputs
              startingCash={scenarioWithEmployees?.startingCash}
              startingCashMonth={scenarioWithEmployees?.startingCashMonth}
              startingCashYear={scenarioWithEmployees?.startingCashYear}
              onUpdate={handleRunwayUpdate}
            />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
