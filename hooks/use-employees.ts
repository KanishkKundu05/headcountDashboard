import * as React from "react"

import type { FilteredEmployee } from "@/lib/types/apify"

interface UseEmployeesResult {
  employees: FilteredEmployee[]
  loading: boolean
  error: string | null
  fetchByCompanyUrl: (companyUrl: string) => Promise<void>
}

export function useEmployees(): UseEmployeesResult {
  const [employees, setEmployees] = React.useState<FilteredEmployee[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchByCompanyUrl = React.useCallback(async (companyUrl: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/employees?companyUrl=${encodeURIComponent(companyUrl)}`
      )
      const data = await response.json()

      if (!response.ok) {
        const message =
          (data && typeof data.message === "string" && data.message) ||
          "Failed to load employees"
        throw new Error(message)
      }

      setEmployees(Array.isArray(data.employees) ? data.employees : [])
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load employees"
      setError(message)
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    employees,
    loading,
    error,
    fetchByCompanyUrl,
  }
}


