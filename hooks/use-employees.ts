import * as React from "react"

import type { FilteredEmployee } from "@/lib/types/apify"

interface UseEmployeesResult {
  employees: FilteredEmployee[]
  loading: boolean
  error: string | null
  fetchByCompanyUrl: (companyUrl: string) => Promise<void>
}

const LOCAL_STORAGE_KEY = "lastEmployees"

interface EmployeesCachePayload {
  companyUrl: string
  employees: FilteredEmployee[]
  timestamp: number
}

function readEmployeesFromStorage(): FilteredEmployee[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as Partial<EmployeesCachePayload>
    if (!parsed || !Array.isArray(parsed.employees)) {
      return []
    }

    return parsed.employees as FilteredEmployee[]
  } catch {
    return []
  }
}

function writeEmployeesToStorage(companyUrl: string, employees: FilteredEmployee[]) {
  if (typeof window === "undefined") return

  try {
    const payload: EmployeesCachePayload = {
      companyUrl,
      employees,
      timestamp: Date.now(),
    }

    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Best-effort cache; ignore write failures (e.g. quota exceeded, disabled storage)
  }
}

export function useEmployees(): UseEmployeesResult {
  const [employees, setEmployees] = React.useState<FilteredEmployee[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Hydrate from localStorage on first client render
  React.useEffect(() => {
    const cached = readEmployeesFromStorage()
    if (cached.length > 0) {
      setEmployees(cached)
    }
  }, [])

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

      const nextEmployees: FilteredEmployee[] = Array.isArray(data.employees)
        ? data.employees
        : []

      setEmployees(nextEmployees)
      writeEmployeesToStorage(companyUrl, nextEmployees)
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


