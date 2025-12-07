"use client";

import * as React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Id } from "@/convex/_generated/dataModel";
import { EmployeeDragData } from "@/components/dnd/dnd-context";

// Shared constants
export const ROW_HEIGHT = 40; // px per employee row

// Employee type from Convex
export interface Employee {
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

// Parse month string to Date components
export function parseMonthString(monthStr: string): { year: number; month: number } {
  const [year, month] = monthStr.split("-").map(Number);
  return { year, month };
}

// Resize handle for employee bars
export function ResizeHandle({
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
    employeeId: employeeId as string,
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

// Props for EmployeeBar
interface EmployeeBarProps {
  employee: Employee;
  months: string[];
  monthWidth: number;
  rowIndex: number;
}

// Draggable employee bar
export function EmployeeBar({
  employee,
  months,
  monthWidth,
  rowIndex,
}: EmployeeBarProps) {
  // Calculate bar position and width based on employee dates
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
      // Check if start is before or after visible range
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
      // Check if end is before or after visible range
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
  const getBarColor = () => {
    const position = employee.position?.toLowerCase() || "";
    if (position.includes("design")) return "#EC4899"; // Pink
    if (position.includes("engineer") || position.includes("developer")) return "#3B82F6"; // Blue
    if (position.includes("product")) return "#8B5CF6"; // Purple
    if (position.includes("marketing")) return "#F59E0B"; // Amber
    if (position.includes("sales")) return "#10B981"; // Emerald
    if (position.includes("ops") || position.includes("operations")) return "#6366F1"; // Indigo
    return "#3B82F6"; // Default blue
  };

  const barColor = getBarColor();

  // Drag data for moving the entire bar
  const dragData: EmployeeDragData = {
    type: "employee",
    employeeId: employee._id as string,
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
        absolute rounded-md px-2 py-1 text-white text-xs font-medium
        cursor-grab active:cursor-grabbing
        flex items-center gap-1
        transition-opacity duration-150
        shadow-sm
        ${isDragging ? "opacity-50 z-50" : "opacity-100"}
      `}
      style={{
        left: left + 2,
        top: rowIndex * ROW_HEIGHT + 4,
        width: Math.max(width, 60),
        height: ROW_HEIGHT - 8,
        backgroundColor: barColor,
      }}
    >
      <span className="truncate flex-1">{displayName}</span>
      
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

