"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RunwayChart } from "@/components/RunwayChart";
import {
  calculateRunway,
  validateRunwayInputs,
} from "@/lib/runway-calculations";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentScenario } from "@/hooks/use-current-scenario";

export function CashRunwayVisualization() {
  const { currentScenarioId } = useCurrentScenario();

  const scenarioWithEmployees = useQuery(
    api.scenarios.getScenarioWithEmployees,
    currentScenarioId ? { id: currentScenarioId } : "skip"
  );

  const updateScenarioFinancials = useMutation(
    api.scenarios.updateScenarioFinancials
  );

  // Debounce updates to avoid excessive mutations
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleUpdate = React.useCallback(
    (
      startingCash: number | undefined,
      startingCashMonth: number | undefined,
      startingCashYear: number | undefined
    ) => {
      if (!currentScenarioId) return;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce for 500ms
      timeoutRef.current = setTimeout(() => {
        updateScenarioFinancials({
          id: currentScenarioId,
          startingCash,
          startingCashMonth,
          startingCashYear,
        });
      }, 500);
    },
    [currentScenarioId, updateScenarioFinancials]
  );

  // Calculate runway data with useMemo for performance
  const runwayData = React.useMemo(() => {
    if (!scenarioWithEmployees) return null;

    const { startingCash, startingCashMonth, startingCashYear, employees } =
      scenarioWithEmployees;

    // Validate inputs
    const validation = validateRunwayInputs(
      startingCash,
      startingCashMonth,
      startingCashYear
    );

    if (!validation.valid) {
      return null;
    }

    // Calculate runway
    return calculateRunway(
      startingCash!,
      startingCashMonth!,
      startingCashYear!,
      employees
    );
  }, [scenarioWithEmployees]);

  // All conditional returns come AFTER all hooks
  if (!currentScenarioId) return null;

  // Loading state - only show skeleton while query is loading (undefined)
  // If query has resolved to null, the scenario doesn't exist - don't show skeleton
  if (scenarioWithEmployees === undefined) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  // Scenario doesn't exist or user doesn't have access - return null
  // The dashboard layout will handle redirecting to a valid scenario
  if (scenarioWithEmployees === null) {
    return null;
  }

  const { startingCash, startingCashMonth, startingCashYear, employees } =
    scenarioWithEmployees;

  // Hide chart entirely when no employees exist
  if (employees.length === 0) {
    return null;
  }

  // Determine if we should show warning (inputs exist but no valid employee data)
  const hasInputs =
    startingCash !== undefined &&
    startingCashMonth !== undefined &&
    startingCashYear !== undefined;
  const showWarning =
    hasInputs && employees.length > 0 && runwayData?.activeEmployeeCount === 0;

  return (
    <RunwayChart
      data={runwayData?.dataPoints}
      monthsOfRunway={runwayData?.monthsOfRunway}
      totalBurnRate={runwayData?.totalBurnRate}
      activeEmployeeCount={runwayData?.activeEmployeeCount}
      useQuarterlyLabels={runwayData?.useQuarterlyLabels}
      showWarning={showWarning}
      missingInputs={!hasInputs}
    />
  );
}

// Export the update handler for use in sidebar
export function useRunwaySettings(scenarioId: Id<"scenarios"> | null) {
  const updateScenarioFinancials = useMutation(
    api.scenarios.updateScenarioFinancials
  );

  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleUpdate = React.useCallback(
    (
      startingCash: number | undefined,
      startingCashMonth: number | undefined,
      startingCashYear: number | undefined
    ) => {
      if (!scenarioId) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        updateScenarioFinancials({
          id: scenarioId,
          startingCash,
          startingCashMonth,
          startingCashYear,
        });
      }, 500);
    },
    [scenarioId, updateScenarioFinancials]
  );

  return handleUpdate;
}
