"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Users } from "lucide-react";

interface Employee {
  _id: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  salary?: number;
  startMonth?: number;
  startYear?: number;
}

interface Scenario {
  _id: string;
  name: string;
  employees: Employee[];
}

function formatSalary(salary?: number): string {
  if (!salary) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(salary);
}

function getDisplayName(employee: Employee): string {
  const firstName = employee.firstName || "";
  const lastName = employee.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || "TBD";
}

export default function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [resolvedParams, setResolvedParams] = useState<{ token: string } | null>(null);

  // Resolve params
  if (!resolvedParams) {
    params.then(setResolvedParams);
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return <ShareContent token={resolvedParams.token} />;
}

function ShareContent({ token }: { token: string }) {
  const sharedData = useQuery(api.sharedLinks.getSharedData, { token });
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  if (sharedData === undefined) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (sharedData === null) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-2">Link Not Found</h1>
          <p className="text-muted-foreground">
            This share link doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const { owner, scenarios } = sharedData;

  // Auto-select first scenario if none selected
  const activeScenarioId = selectedScenarioId ?? scenarios[0]?._id ?? null;
  const activeScenario = scenarios.find((s) => s._id === activeScenarioId);

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Users className="h-4 w-4" />
          <span>Shared by {owner.name}</span>
        </div>
        <h1 className="text-3xl font-bold">Headcount Scenarios</h1>
        <p className="text-muted-foreground mt-1">
          {scenarios.length} scenario{scenarios.length !== 1 ? "s" : ""} shared
        </p>
      </div>

      {/* Scenario Tabs */}
      {scenarios.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {scenarios.map((scenario) => (
            <Button
              key={scenario._id}
              variant={activeScenarioId === scenario._id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedScenarioId(scenario._id)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              {scenario.name}
              <span className="text-xs opacity-70">
                ({scenario.employees.length})
              </span>
            </Button>
          ))}
        </div>
      )}

      {/* Employee Table */}
      {activeScenario ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Start Date</TableHead>
                <TableHead>Salary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeScenario.employees.length > 0 ? (
                activeScenario.employees.map((employee) => {
                  const name = getDisplayName(employee);
                  const isPlaceholder = !employee.firstName && !employee.lastName;

                  let startDate = "—";
                  if (employee.startYear) {
                    const month =
                      typeof employee.startMonth === "number" &&
                      employee.startMonth >= 1 &&
                      employee.startMonth <= 12
                        ? new Date(2000, employee.startMonth - 1, 1).toLocaleString(
                            "en-US",
                            { month: "short" }
                          )
                        : "";
                    startDate = month
                      ? `${month} ${employee.startYear}`
                      : String(employee.startYear);
                  }

                  return (
                    <TableRow key={employee._id}>
                      <TableCell
                        className={`font-medium ${
                          isPlaceholder ? "text-muted-foreground italic" : ""
                        }`}
                      >
                        {name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {employee.position ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {startDate}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatSalary(employee.salary)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No employees in this scenario.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          No scenarios to display.
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>This is a read-only view. Sign in to create your own scenarios.</p>
      </div>
    </div>
  );
}
