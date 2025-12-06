"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Id } from "@/convex/_generated/dataModel";

export function useCurrentScenario() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get single scenario ID (for single view)
  const currentScenarioId = searchParams.get("scenario") as Id<"scenarios"> | null;

  // Get multiple scenario IDs (for comparison view)
  const scenarioIds = searchParams.get("scenarios")?.split(",").filter(Boolean) as Id<"scenarios">[] | undefined;

  // Set single scenario
  const setCurrentScenarioId = useCallback(
    (id: Id<"scenarios"> | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) {
        params.set("scenario", id);
        params.delete("scenarios"); // Clear multi-select when selecting single
      } else {
        params.delete("scenario");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  // Set multiple scenarios (for comparison)
  const setScenarioIds = useCallback(
    (ids: Id<"scenarios">[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (ids.length > 0) {
        params.set("scenarios", ids.join(","));
        params.delete("scenario"); // Clear single when selecting multiple
      } else {
        params.delete("scenarios");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  // Generate shareable URL
  const getShareableUrl = useCallback(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, []);

  return {
    currentScenarioId,
    scenarioIds: scenarioIds ?? [],
    setCurrentScenarioId,
    setScenarioIds,
    getShareableUrl,
  };
}
