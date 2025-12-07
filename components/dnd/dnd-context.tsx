"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverEvent,
} from "@dnd-kit/core";
import { ReactNode, useState, useId, createContext, useContext } from "react";
import { RoleTemplate } from "@/lib/role-templates";

// Types for drag data
export interface RoleDragData {
  type: "role";
  template: RoleTemplate;
}

export interface EmployeeDragData {
  type: "employee";
  employeeId: string;
  action: "move" | "resize-start" | "resize-end";
}

export type DragData = RoleDragData | EmployeeDragData;

interface DndProviderContextValue {
  activeData: DragData | null;
  overId: string | null;
}

const DndProviderContext = createContext<DndProviderContextValue>({
  activeData: null,
  overId: null,
});

export function useDndProviderContext() {
  return useContext(DndProviderContext);
}

interface DndProviderProps {
  children: ReactNode;
  onDropRole?: (template: RoleTemplate, targetMonth: string) => void;
  onMoveEmployee?: (employeeId: string, newStartMonth: string) => void;
  onResizeEmployee?: (
    employeeId: string,
    edge: "start" | "end",
    newMonth: string
  ) => void;
}

export function DndProvider({
  children,
  onDropRole,
  onMoveEmployee,
  onResizeEmployee,
}: DndProviderProps) {
  // Use useId() to generate stable IDs for SSR hydration
  const dndContextId = useId();

  // Track the currently dragged data for the overlay
  const [activeData, setActiveData] = useState<DragData | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Configure mouse sensor with activation constraint
  // Requires 10px movement before drag starts (prevents accidental drags)
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });

  // Configure touch sensor with delay for mobile
  // 250ms delay prevents scrolling from triggering drags
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  // Called when drag starts - store the data being dragged
  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragData | undefined;
    if (data) {
      setActiveData(data);
    }
  }

  // Called when dragging over a droppable
  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over?.id as string | null);
  }

  // Called when drag ends - handle the drop based on drag type
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.data.current) {
      const data = active.data.current as DragData;
      const targetMonth = over.id as string;

      if (data.type === "role" && onDropRole) {
        onDropRole(data.template, targetMonth);
      } else if (data.type === "employee") {
        if (data.action === "move" && onMoveEmployee) {
          onMoveEmployee(data.employeeId, targetMonth);
        } else if (
          (data.action === "resize-start" || data.action === "resize-end") &&
          onResizeEmployee
        ) {
          const edge = data.action === "resize-start" ? "start" : "end";
          onResizeEmployee(data.employeeId, edge, targetMonth);
        }
      }
    }

    setActiveData(null);
    setOverId(null);
  }

  return (
    <DndProviderContext.Provider value={{ activeData, overId }}>
      <DndContext
        id={dndContextId}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {children}

        {/* DragOverlay renders outside the normal DOM flow,
            following the cursor during drag */}
        <DragOverlay>
          {activeData?.type === "role" ? (
            <div
              className="px-3 py-2 rounded-md shadow-lg text-white text-sm font-medium opacity-90"
              style={{ backgroundColor: activeData.template.color }}
            >
              {activeData.template.name}
            </div>
          ) : activeData?.type === "employee" ? (
            <div className="px-3 py-2 rounded-md shadow-lg bg-blue-500 text-white text-sm font-medium opacity-90">
              Moving...
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </DndProviderContext.Provider>
  );
}

