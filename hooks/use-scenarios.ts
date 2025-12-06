"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useScenarios() {
  const scenarios = useQuery(api.scenarios.getScenarios);
  const createScenario = useMutation(api.scenarios.createScenario);
  const updateScenario = useMutation(api.scenarios.updateScenario);
  const deleteScenario = useMutation(api.scenarios.deleteScenario);
  const createScenarioFromLinkedIn = useMutation(api.scenarios.createScenarioFromLinkedIn);

  return {
    scenarios: scenarios ?? [],
    loading: scenarios === undefined,
    createScenario,
    updateScenario,
    deleteScenario,
    createScenarioFromLinkedIn,
  };
}

export function useScenarioWithEmployees(scenarioId: Id<"scenarios"> | null) {
  const scenarioWithEmployees = useQuery(
    api.scenarios.getScenarioWithEmployees,
    scenarioId ? { id: scenarioId } : "skip"
  );

  const addEmployeeToScenario = useMutation(api.scenarios.addEmployeeToScenario);
  const removeEmployeeFromScenario = useMutation(api.scenarios.removeEmployeeFromScenario);

  return {
    scenario: scenarioWithEmployees ?? null,
    loading: scenarioWithEmployees === undefined,
    addEmployeeToScenario,
    removeEmployeeFromScenario,
  };
}
