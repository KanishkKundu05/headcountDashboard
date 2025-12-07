"use client";

import { createContext, useContext } from "react";

export type ViewMode = "table" | "timeline";

interface ViewModeContextValue {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const ViewModeContext = createContext<ViewModeContextValue>({
  viewMode: "table",
  setViewMode: () => {},
});

export function useViewMode() {
  return useContext(ViewModeContext);
}

