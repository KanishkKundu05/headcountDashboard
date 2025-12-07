"use client";

import * as React from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { Id } from "@/convex/_generated/dataModel";
import { useDndProviderContext, EmployeeDragData } from "@/components/dnd/dnd-context";
import { Button } from "@/components/ui/button";

// Constants
const MONTH_WIDTH = 100; // px per month in quarterly view
const YEAR_MONTH_WIDTH = 30; // px per month in yearly view
const ROW_HEIGHT = 40; // px per employee row
const HEADER_HEIGHT = 32; // px for month headers

// Employee type from Convex
interface Employee {
  _id: Id<"employees">;
  firstName?: string;
  lastName?: string;
  pictureUrl?: string;
  position?: string;
  salary?: number;
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
  linkedinUrl?: string;
}

interface TimelineProps {
  employees: Employee[];
  onUpdateEmployee: (
    employeeId: Id<"employees">,
    updates: {
      startMonth?: number;
      startYear?: number;
      endMonth?: number;
      endYear?: number;
    }
  ) => Promise<void>;
}

type ViewMode = "quarterly" | "yearly";

// Helper to generate month array
function generateMonths(startDate: Date, count: number): string[] {
  const months: string[] = [];
  const date = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-indexed
    months.push(`${year}-${month.toString().padStart(2, "0")}`);
    date.setMonth(date.getMonth() + 1);
  }
  return months;
}

// Parse month string to Date
function parseMonthString(monthStr: string): { year: number; month: number } {
  const [year, month] = monthStr.split("-").map(Number);
  return { year, month };
}

// Format month for display
function formatMonthLabel(monthStr: string, viewMode: ViewMode): string {
  const { year, month } = parseMonthString(monthStr);
  const date = new Date(year, month - 1);
  if (viewMode === "yearly") {
    return date.toLocaleDateString("en-US", { month: "short" });
  }
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// Get quarter label
function getQuarterLabel(monthStr: string): string {
  const { year, month } = parseMonthString(monthStr);
  const quarter = Math.ceil(month / 3);
  return `Q${quarter} ${year}`;
}

// Check if month is start of quarter
function isQuarterStart(monthStr: string): boolean {
  const { month } = parseMonthString(monthStr);
  return month % 3 === 1;
}

// Check if month is start of year
function isYearStart(monthStr: string): boolean {
  const { month } = parseMonthString(monthStr);
  return month === 1;
}

// Droppable zone for each month
function MonthDropZone({
  month,
  viewMode,
  showQuarterLabel,
}: {
  month: string;
  viewMode: ViewMode;
  showQuarterLabel: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: month,
  });

  const width = viewMode === "quarterly" ? MONTH_WIDTH : YEAR_MONTH_WIDTH;
  const showBorder = viewMode === "quarterly" ? isQuarterStart(month) : isYearStart(month);

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0 h-full relative
        ${showBorder ? "border-l border-gray-300" : "border-l border-gray-100"}
        ${isOver ? "bg-blue-50" : ""}
        transition-colors duration-150
      `}
      style={{ width }}
    >
      {/* Quarter/Year label at top */}
      {showQuarterLabel && (
        <div className="absolute -top-6 left-0 text-xs font-medium text-gray-500 whitespace-nowrap">
          {viewMode === "quarterly" ? getQuarterLabel(month) : parseMonthString(month).year}
        </div>
      )}
    </div>
  );
}

// Header cell for month
function MonthHeader({ month, viewMode }: { month: string; viewMode: ViewMode }) {
  const width = viewMode === "quarterly" ? MONTH_WIDTH : YEAR_MONTH_WIDTH;
  const showBorder = viewMode === "quarterly" ? isQuarterStart(month) : isYearStart(month);

  return (
    <div
      className={`
        flex-shrink-0 flex items-center justify-center
        text-xs text-gray-600 font-medium
        ${showBorder ? "border-l border-gray-300" : "border-l border-gray-100"}
        bg-gray-50
      `}
      style={{ width, height: HEADER_HEIGHT }}
    >
      {formatMonthLabel(month, viewMode)}
    </div>
  );
}

// Draggable employee bar
function EmployeeBar({
  employee,
  months,
  viewMode,
  rowIndex,
}: {
  employee: Employee;
  months: string[];
  viewMode: ViewMode;
  rowIndex: number;
}) {
  const monthWidth = viewMode === "quarterly" ? MONTH_WIDTH : YEAR_MONTH_WIDTH;

  // Calculate bar position and width
  const startMonthStr = employee.startMonth && employee.startYear
    ? `${employee.startYear}-${employee.startMonth.toString().padStart(2, "0")}`
    : null;
  const endMonthStr = employee.endMonth && employee.endYear
    ? `${employee.endYear}-${employee.endMonth.toString().padStart(2, "0")}`
    : null;

  // Find start index
  let startIndex = 0;
  if (startMonthStr) {
    const idx = months.indexOf(startMonthStr);
    if (idx !== -1) {
      startIndex = idx;
    } else {
      // Start is before visible range
      const { year, month } = parseMonthString(startMonthStr);
      const firstVisible = parseMonthString(months[0]);
      if (year < firstVisible.year || (year === firstVisible.year && month < firstVisible.month)) {
        startIndex = 0;
      } else {
        // Start is after visible range - don't show
        return null;
      }
    }
  }

  // Find end index
  let endIndex = months.length - 1;
  if (endMonthStr) {
    const idx = months.indexOf(endMonthStr);
    if (idx !== -1) {
      endIndex = idx;
    } else {
      // End is beyond visible range
      const { year, month } = parseMonthString(endMonthStr);
      const lastVisible = parseMonthString(months[months.length - 1]);
      if (year > lastVisible.year || (year === lastVisible.year && month > lastVisible.month)) {
        endIndex = months.length - 1;
      } else {
        // End is before visible range - don't show
        return null;
      }
    }
  }

  // If start is after end, don't render
  if (startIndex > endIndex) {
    return null;
  }

  const left = startIndex * monthWidth;
  const width = (endIndex - startIndex + 1) * monthWidth - 4; // -4 for padding

  // Get display name
  const displayName = employee.firstName || employee.lastName
    ? `${employee.firstName || ""} ${employee.lastName || ""}`.trim()
    : employee.position || "TBD";

  // Determine bar color based on position
  const isDesigner = employee.position?.toLowerCase().includes("design");
  const barColor = isDesigner ? "#EC4899" : "#3B82F6";

  // Drag data for moving the entire bar
  const dragData: EmployeeDragData = {
    type: "employee",
    employeeId: employee._id,
    action: "move",
  };

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `employee-${employee._id}`,
    data: dragData,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        absolute rounded px-2 py-1 text-white text-xs font-medium
        cursor-grab active:cursor-grabbing
        flex items-center gap-1
        transition-opacity duration-150
        ${isDragging ? "opacity-50" : "opacity-100"}
      `}
      style={{
        left: left + 2,
        top: rowIndex * ROW_HEIGHT + 4,
        width: Math.max(width, 60),
        height: ROW_HEIGHT - 8,
        backgroundColor: barColor,
      }}
    >
      <span className="truncate">{displayName}</span>
      
      {/* Resize handles */}
      <ResizeHandle
        employeeId={employee._id}
        edge="start"
        position="left"
      />
      <ResizeHandle
        employeeId={employee._id}
        edge="end"
        position="right"
      />
    </div>
  );
}

// Resize handle for employee bars
function ResizeHandle({
  employeeId,
  edge,
  position,
}: {
  employeeId: Id<"employees">;
  edge: "start" | "end";
  position: "left" | "right";
}) {
  const dragData: EmployeeDragData = {
    type: "employee",
    employeeId,
    action: edge === "start" ? "resize-start" : "resize-end",
  };

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `resize-${edge}-${employeeId}`,
    data: dragData,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        absolute top-0 bottom-0 w-2 cursor-ew-resize
        hover:bg-white/20 transition-colors
        ${position === "left" ? "left-0" : "right-0"}
        ${isDragging ? "bg-white/30" : ""}
      `}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

export function Timeline({ employees, onUpdateEmployee }: TimelineProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("quarterly");
  const { overId } = useDndProviderContext();

  // Generate timeline months (starting from current month, going 24 months out)
  const startDate = new Date();
  startDate.setDate(1); // First of current month
  const monthCount = viewMode === "quarterly" ? 18 : 24;
  const months = React.useMemo(
    () => generateMonths(startDate, monthCount),
    [monthCount]
  );

  const monthWidth = viewMode === "quarterly" ? MONTH_WIDTH : YEAR_MONTH_WIDTH;
  const totalWidth = months.length * monthWidth;

  // Filter employees that have dates in visible range
  const visibleEmployees = employees.filter((emp) => {
    // Show all employees for now, bar calculation handles visibility
    return true;
  });

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header with toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-900">Timeline</h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md overflow-hidden border">
            <Button
              variant={viewMode === "quarterly" ? "default" : "ghost"}
              size="sm"
              className="rounded-none h-7 px-3"
              onClick={() => setViewMode("quarterly")}
            >
              Quarterly
            </Button>
            <Button
              variant={viewMode === "yearly" ? "default" : "ghost"}
              size="sm"
              className="rounded-none h-7 px-3"
              onClick={() => setViewMode("yearly")}
            >
              Yearly
            </Button>
          </div>
          <span className="text-sm text-gray-500 ml-2">
            {visibleEmployees.length} employees
          </span>
        </div>
      </div>

      {/* Timeline content */}
      <div className="overflow-x-auto">
        <div style={{ width: totalWidth, minWidth: "100%" }}>
          {/* Month headers */}
          <div className="flex border-b" style={{ height: HEADER_HEIGHT }}>
            {months.map((month) => (
              <MonthHeader key={month} month={month} viewMode={viewMode} />
            ))}
          </div>

          {/* Timeline grid with employee bars */}
          <div
            className="relative"
            style={{
              height: Math.max(visibleEmployees.length * ROW_HEIGHT + 20, 200),
              paddingTop: 24, // Space for quarter/year labels
            }}
          >
            {/* Droppable zones */}
            <div className="absolute inset-0 flex" style={{ top: 24 }}>
              {months.map((month, idx) => (
                <MonthDropZone
                  key={month}
                  month={month}
                  viewMode={viewMode}
                  showQuarterLabel={
                    viewMode === "quarterly"
                      ? isQuarterStart(month)
                      : isYearStart(month)
                  }
                />
              ))}
            </div>

            {/* Employee bars */}
            <div className="absolute inset-0" style={{ top: 24 }}>
              {visibleEmployees.map((employee, idx) => (
                <EmployeeBar
                  key={employee._id}
                  employee={employee}
                  months={months}
                  viewMode={viewMode}
                  rowIndex={idx}
                />
              ))}
            </div>

            {/* Drop indicator */}
            {overId && (
              <div
                className="absolute top-0 bottom-0 bg-blue-200/30 pointer-events-none"
                style={{
                  left: months.indexOf(overId as string) * monthWidth,
                  width: monthWidth,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {visibleEmployees.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: HEADER_HEIGHT + 24 }}>
          <p className="text-sm text-gray-400">
            Drag a role from the sidebar to add employees
          </p>
        </div>
      )}
    </div>
  );
}