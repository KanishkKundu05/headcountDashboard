"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export interface Employee {
  _id: Id<"employees">;
  firstName?: string;
  lastName?: string;
  pictureUrl?: string;
  position?: string;
  salary?: number;
  startMonth?: number;
  startYear?: number;
  linkedinUrl?: string;
}

export function useEmployees() {
  const employees = useQuery(api.employees.getEmployees);
  const createEmployee = useMutation(api.employees.createEmployee);
  const updateEmployee = useMutation(api.employees.updateEmployee);
  const deleteEmployee = useMutation(api.employees.deleteEmployee);
  const bulkCreateEmployees = useMutation(api.employees.bulkCreateEmployees);

  return {
    employees: employees ?? [],
    loading: employees === undefined,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    bulkCreateEmployees,
  };
}


