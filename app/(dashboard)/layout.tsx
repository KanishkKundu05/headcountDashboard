"use client";

import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useCallback, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { RunwayInputs } from "@/components/RunwayInputs";
import { useRunwaySettings } from "@/components/CashRunwayVisualization";
import { useCurrentScenario } from "@/hooks/use-current-scenario";
import { ViewModeContext, ViewMode } from "@/hooks/use-view-mode";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { EditableCell } from "@/components/editable-cell";
import { DndProvider } from "@/components/dnd/dnd-context";
import { RoleTemplate } from "@/lib/role-templates";

// Helper to parse month string (e.g., "2025-01") to year/month
function parseMonthString(monthStr: string): { year: number; month: number } {
  const [year, month] = monthStr.split("-").map(Number);
  return { year, month };
}

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
  const handleRunwayUpdate = useRunwaySettings(currentScenarioId);
  const updateScenario = useMutation(api.scenarios.updateScenario);
  const createEmployee = useMutation(api.employees.createEmployee);
  const addEmployeeToScenario = useMutation(api.scenarios.addEmployeeToScenario);
  const updateEmployee = useMutation(api.employees.updateEmployee);

  // View mode state (shared via context)
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signup");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleScenarioNameUpdate = async (newName: string) => {
    if (currentScenarioId && newName.trim()) {
      await updateScenario({ id: currentScenarioId, name: newName.trim() });
    }
  };

  // Handle dropping a role template onto the timeline
  const handleDropRole = useCallback(
    async (template: RoleTemplate, targetMonth: string) => {
      if (!currentScenarioId) return;

      const { year, month } = parseMonthString(targetMonth);
      
      // Create a new employee with the role template data
      const employeeId = await createEmployee({
        position: template.name,
        salary: template.defaultSalary,
        startMonth: month,
        startYear: year,
      });

      // Add to current scenario
      await addEmployeeToScenario({
        scenarioId: currentScenarioId,
        employeeId,
      });
    },
    [currentScenarioId, createEmployee, addEmployeeToScenario]
  );

  // Handle moving an employee to a new start month
  const handleMoveEmployee = useCallback(
    async (employeeId: string, newStartMonth: string) => {
      const employee = scenarioWithEmployees?.employees.find(
        (e) => e._id === employeeId
      );
      if (!employee) return;

      const { year: newYear, month: newMonth } = parseMonthString(newStartMonth);
      
      // Calculate the duration if employee has both start and end
      let newEndMonth: number | undefined;
      let newEndYear: number | undefined;
      
      if (employee.startMonth && employee.startYear && employee.endMonth && employee.endYear) {
        // Calculate duration in months
        const startMonths = employee.startYear * 12 + employee.startMonth;
        const endMonths = employee.endYear * 12 + employee.endMonth;
        const duration = endMonths - startMonths;
        
        // Apply same duration to new position
        const newEndMonths = newYear * 12 + newMonth + duration;
        newEndYear = Math.floor(newEndMonths / 12);
        newEndMonth = newEndMonths % 12 || 12;
        if (newEndMonth === 12) newEndYear--;
      }

      await updateEmployee({
        id: employeeId as Id<"employees">,
        startMonth: newMonth,
        startYear: newYear,
        ...(newEndMonth !== undefined && { endMonth: newEndMonth }),
        ...(newEndYear !== undefined && { endYear: newEndYear }),
      });
    },
    [scenarioWithEmployees?.employees, updateEmployee]
  );

  // Handle resizing an employee's start or end date
  const handleResizeEmployee = useCallback(
    async (employeeId: string, edge: "start" | "end", newMonth: string) => {
      const { year, month } = parseMonthString(newMonth);

      if (edge === "start") {
        await updateEmployee({
          id: employeeId as Id<"employees">,
          startMonth: month,
          startYear: year,
        });
      } else {
        await updateEmployee({
          id: employeeId as Id<"employees">,
          endMonth: month,
          endYear: year,
        });
      }
    },
    [updateEmployee]
  );

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
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      <DndProvider
        onDropRole={handleDropRole}
        onMoveEmployee={handleMoveEmployee}
        onResizeEmployee={handleResizeEmployee}
      >
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-[4.25rem] items-center justify-between gap-4 border-b px-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                {scenarioWithEmployees && (
                  <EditableCell
                    value={scenarioWithEmployees.name}
                    onSave={handleScenarioNameUpdate}
                    className="text-lg font-semibold"
                    placeholder="Scenario Name"
                  />
                )}
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
            <div className="flex flex-1 flex-col gap-4 p-4">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </DndProvider>
    </ViewModeContext.Provider>
  );
}
