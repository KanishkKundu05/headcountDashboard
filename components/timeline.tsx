"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Id } from "@/convex/_generated/dataModel";
import { useDndProviderContext } from "@/components/dnd/dnd-context";
import { Button } from "@/components/ui/button";
import { EmployeeBar, Employee, ROW_HEIGHT, parseMonthString } from "@/components/employeebars";

// Constants
const MONTH_WIDTH = 100; // px per month in quarterly view
const YEAR_MONTH_WIDTH = 30; // px per month in yearly view
const HEADER_HEIGHT = 32; // px for month headers
const SCROLL_BUFFER = 12; // months to load on each side
const SCROLL_THRESHOLD = 200; // px from edge to trigger loading more

type ViewMode = "quarterly" | "yearly";

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

// Helper to generate month array from a start date
function generateMonths(startYear: number, startMonth: number, count: number): string[] {
  const months: string[] = [];
  let year = startYear;
  let month = startMonth;
  
  for (let i = 0; i < count; i++) {
    months.push(`${year}-${month.toString().padStart(2, "0")}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return months;
}

// Helper to subtract months from a date
function subtractMonths(year: number, month: number, count: number): { year: number; month: number } {
  let y = year;
  let m = month - count;
  
  while (m < 1) {
    m += 12;
    y--;
  }
  
  return { year: y, month: m };
}

// Helper to add months to a date
function addMonths(year: number, month: number, count: number): { year: number; month: number } {
  let y = year;
  let m = month + count;
  
  while (m > 12) {
    m -= 12;
    y++;
  }
  
  return { year: y, month: m };
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

export function Timeline({ employees, onUpdateEmployee }: TimelineProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("quarterly");
  const { overId } = useDndProviderContext();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Current date as the anchor point
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  
  // State for the visible month range (offset from current month)
  const [startOffset, setStartOffset] = React.useState(-SCROLL_BUFFER);
  const [endOffset, setEndOffset] = React.useState(SCROLL_BUFFER * 2);
  
  // Track if we need to preserve scroll position after prepending months
  const [pendingScrollAdjustment, setPendingScrollAdjustment] = React.useState(0);
  
  // Track the previously visible month for view mode changes
  const [anchorMonth, setAnchorMonth] = React.useState<string | null>(null);
  
  // Generate months based on current offsets
  const months = React.useMemo(() => {
    const start = subtractMonths(currentYear, currentMonth, -startOffset);
    const totalMonths = endOffset - startOffset;
    return generateMonths(start.year, start.month, totalMonths);
  }, [currentYear, currentMonth, startOffset, endOffset]);
  
  const monthWidth = viewMode === "quarterly" ? MONTH_WIDTH : YEAR_MONTH_WIDTH;
  const totalWidth = months.length * monthWidth;
  
  // Index of the current month in the array
  const currentMonthIndex = React.useMemo(() => {
    const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, "0")}`;
    return months.indexOf(currentMonthStr);
  }, [months, currentYear, currentMonth]);
  
  // Scroll to current month on initial render
  React.useEffect(() => {
    if (scrollContainerRef.current && currentMonthIndex >= 0) {
      const targetScroll = currentMonthIndex * monthWidth - 100; // 100px padding from left
      scrollContainerRef.current.scrollLeft = Math.max(0, targetScroll);
    }
  }, []); // Only on mount
  
  // Handle scroll position adjustment after prepending months
  React.useEffect(() => {
    if (pendingScrollAdjustment !== 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += pendingScrollAdjustment;
      setPendingScrollAdjustment(0);
    }
  }, [pendingScrollAdjustment]);
  
  // Handle view mode change - preserve visible month
  const handleViewModeChange = (newMode: ViewMode) => {
    if (scrollContainerRef.current) {
      // Calculate which month is currently at the center of the viewport
      const container = scrollContainerRef.current;
      const centerX = container.scrollLeft + container.clientWidth / 2;
      const currentMonthWidth = viewMode === "quarterly" ? MONTH_WIDTH : YEAR_MONTH_WIDTH;
      const centerMonthIndex = Math.floor(centerX / currentMonthWidth);
      const centerMonth = months[Math.min(centerMonthIndex, months.length - 1)];
      setAnchorMonth(centerMonth);
    }
    setViewMode(newMode);
  };
  
  // Scroll to anchor month after view mode change
  React.useEffect(() => {
    if (anchorMonth && scrollContainerRef.current) {
      const monthIndex = months.indexOf(anchorMonth);
      if (monthIndex >= 0) {
        const container = scrollContainerRef.current;
        const targetScroll = monthIndex * monthWidth - container.clientWidth / 2;
        container.scrollLeft = Math.max(0, targetScroll);
      }
      setAnchorMonth(null);
    }
  }, [viewMode, anchorMonth, months, monthWidth]);
  
  // Handle scroll to load more months
  const handleScroll = React.useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    // Check if we're near the left edge
    if (scrollLeft < SCROLL_THRESHOLD) {
      const monthsToAdd = SCROLL_BUFFER;
      const newStartOffset = startOffset - monthsToAdd;
      const scrollAdjustment = monthsToAdd * monthWidth;
      
      setStartOffset(newStartOffset);
      setPendingScrollAdjustment(scrollAdjustment);
    }
    
    // Check if we're near the right edge
    if (scrollWidth - scrollLeft - clientWidth < SCROLL_THRESHOLD) {
      setEndOffset((prev) => prev + SCROLL_BUFFER);
    }
  }, [startOffset, monthWidth]);
  
  // Debounced scroll handler
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const debouncedHandleScroll = React.useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(handleScroll, 100);
  }, [handleScroll]);
  
  // Filter employees that have dates in visible range
  const visibleEmployees = employees.filter(() => {
    // Show all employees for now, bar calculation handles visibility
    return true;
  });

  return (
    <div className="border rounded-lg overflow-hidden bg-white w-full max-w-full">
      {/* Header with toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-900">Timeline</h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md overflow-hidden border">
            <Button
              variant={viewMode === "quarterly" ? "default" : "ghost"}
              size="sm"
              className="rounded-none h-7 px-3"
              onClick={() => handleViewModeChange("quarterly")}
            >
              Quarterly
            </Button>
            <Button
              variant={viewMode === "yearly" ? "default" : "ghost"}
              size="sm"
              className="rounded-none h-7 px-3"
              onClick={() => handleViewModeChange("yearly")}
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
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto w-full"
        onScroll={debouncedHandleScroll}
      >
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
              {months.map((month) => (
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
                  monthWidth={monthWidth}
                  rowIndex={idx}
                />
              ))}
            </div>

            {/* Drop indicator */}
            {overId && months.includes(overId as string) && (
              <div
                className="absolute top-0 bottom-0 bg-blue-200/30 pointer-events-none"
                style={{
                  left: months.indexOf(overId as string) * monthWidth,
                  width: monthWidth,
                  top: 24,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {visibleEmployees.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-gray-400">
            Drag a role from the sidebar to add employees
          </p>
        </div>
      )}
    </div>
  );
}
