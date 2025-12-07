"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Trash2, Plus, Copy, Link, ChevronDown, Table2, CalendarRange } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LinkedinCompanyInput } from "@/components/LinkedinCompanyInput"
import { useCurrentScenario } from "@/hooks/use-current-scenario"
import { useViewMode } from "@/hooks/use-view-mode"
import { Skeleton } from "@/components/ui/skeleton"
import { EditableCell } from "@/components/editable-cell"
import { Timeline } from "@/components/timeline"

// Employee type from Convex
interface Employee {
  _id: Id<"employees">
  firstName?: string
  lastName?: string
  pictureUrl?: string
  position?: string
  salary?: number
  startMonth?: number
  startYear?: number
  endMonth?: number
  endYear?: number
  linkedinUrl?: string
}

// Helper to format salary
function formatSalary(salary?: number): string {
  if (!salary) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(salary)
}

// Helper to get display name
function getDisplayName(employee: Employee): string {
  const firstName = employee.firstName || ""
  const lastName = employee.lastName || ""
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || "TBD"
}

export function DataTableDemo() {
  const { currentScenarioId, setCurrentScenarioId } = useCurrentScenario()
  const scenarios = useQuery(api.scenarios.getScenarios)
  const scenarioWithEmployees = useQuery(
    api.scenarios.getScenarioWithEmployees,
    currentScenarioId ? { id: currentScenarioId } : "skip"
  )
  const linkedinScrapes = useQuery(api.scenarios.getLinkedinScrapes)

  const createScenarioFromLinkedIn = useMutation(api.scenarios.createScenarioFromLinkedIn)
  const createScenario = useMutation(api.scenarios.createScenario)
  const addEmployeesFromLinkedIn = useMutation(api.scenarios.addEmployeesFromLinkedIn)
  const addEmployeesToScenario = useMutation(api.scenarios.addEmployeesToScenario)
  const copyEmployeesFromScenario = useMutation(api.scenarios.copyEmployeesFromScenario)
  const createEmployee = useMutation(api.employees.createEmployee)
  const addEmployeeToScenario = useMutation(api.scenarios.addEmployeeToScenario)
  const updateEmployee = useMutation(api.employees.updateEmployee)
  const removeEmployeeFromScenario = useMutation(api.scenarios.removeEmployeeFromScenario)
  const removeEmployeesFromScenario = useMutation(api.scenarios.removeEmployeesFromScenario)

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [linkedInLoading, setLinkedInLoading] = React.useState(false)
  const [linkedInError, setLinkedInError] = React.useState<string | null>(null)
  const [showLinkedInInput, setShowLinkedInInput] = React.useState(false)
  const { viewMode, setViewMode } = useViewMode()

  // Auto-select first scenario if none selected or if current selection is invalid
  React.useEffect(() => {
    if (!scenarios) return // Still loading
    
    // If no scenario selected and we have scenarios, select first one
    if (!currentScenarioId && scenarios.length > 0) {
      setCurrentScenarioId(scenarios[0]._id)
      return
    }
    
    // If scenario is selected but query returned null (invalid/not owned), 
    // and we've finished loading the query, clear and select first valid one
    if (currentScenarioId && scenarioWithEmployees === null && scenarios.length > 0) {
      // Verify the ID doesn't exist in user's scenarios
      const isValidScenario = scenarios.some(s => s._id === currentScenarioId)
      if (!isValidScenario) {
        setCurrentScenarioId(scenarios[0]._id)
      }
    }
  }, [currentScenarioId, scenarios, scenarioWithEmployees, setCurrentScenarioId])

  const employees: Employee[] = scenarioWithEmployees?.employees ?? []
  // Loading only while queries are undefined (loading), not when they return null (no data/invalid)
  const loading = scenarios === undefined || (currentScenarioId && scenarioWithEmployees === undefined)
  const hasScenarios = scenarios && scenarios.length > 0
  const hasEmployees = employees.length > 0

  // Derived state for empty state layout
  const otherScenarios = scenarios?.filter((s) => s._id !== currentScenarioId) ?? []
  const hasOtherScenarios = otherScenarios.length > 0
  const hasScrapeHistory = linkedinScrapes && linkedinScrapes.length > 0
  const isFirstTimeUser = !hasOtherScenarios && !hasScrapeHistory

  // Handle LinkedIn import - creates a new scenario (for first-time users)
  const handleLinkedInSubmit = async (companyUrl: string) => {
    try {
      setLinkedInLoading(true)
      setLinkedInError(null)

      const response = await fetch(
        `/api/employees?companyUrl=${encodeURIComponent(companyUrl)}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to load employees")
      }

      const fetchedEmployees = Array.isArray(data.employees) ? data.employees : []

      // Extract company name from URL for scenario name
      const urlParts = companyUrl.split("/")
      const companySlug = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || "New Scenario"
      const scenarioName = companySlug.charAt(0).toUpperCase() + companySlug.slice(1)

      // Create scenario with employees and scrape record
      const result = await createScenarioFromLinkedIn({
        name: scenarioName,
        companyUrl,
        employees: fetchedEmployees.map((emp: { firstName?: string; lastName?: string; pictureUrl?: string; currentTitle?: string; currentStartMonth?: number | null; currentStartYear?: number | null }) => ({
          firstName: emp.firstName,
          lastName: emp.lastName,
          pictureUrl: emp.pictureUrl,
          position: emp.currentTitle,
          startMonth: emp.currentStartMonth ?? undefined,
          startYear: emp.currentStartYear ?? undefined,
        })),
      })

      // Switch to the new scenario
      setCurrentScenarioId(result.scenarioId)
    } catch (error) {
      setLinkedInError(error instanceof Error ? error.message : "Failed to import")
    } finally {
      setLinkedInLoading(false)
    }
  }

  // Handle LinkedIn import to existing scenario
  const handleLinkedInImportToScenario = async (companyUrl: string) => {
    if (!currentScenarioId) return

    try {
      setLinkedInLoading(true)
      setLinkedInError(null)

      const response = await fetch(
        `/api/employees?companyUrl=${encodeURIComponent(companyUrl)}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to load employees")
      }

      const fetchedEmployees = Array.isArray(data.employees) ? data.employees : []

      // Extract company name from URL
      const urlParts = companyUrl.split("/")
      const companySlug = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || "LinkedIn Import"
      const companyName = companySlug.charAt(0).toUpperCase() + companySlug.slice(1)

      // Add employees to current scenario and create scrape record
      await addEmployeesFromLinkedIn({
        scenarioId: currentScenarioId,
        companyName,
        companyUrl,
        employees: fetchedEmployees.map((emp: { firstName?: string; lastName?: string; pictureUrl?: string; currentTitle?: string; currentStartMonth?: number | null; currentStartYear?: number | null }) => ({
          firstName: emp.firstName,
          lastName: emp.lastName,
          pictureUrl: emp.pictureUrl,
          position: emp.currentTitle,
          startMonth: emp.currentStartMonth ?? undefined,
          startYear: emp.currentStartYear ?? undefined,
        })),
      })

      setShowLinkedInInput(false)
    } catch (error) {
      setLinkedInError(error instanceof Error ? error.message : "Failed to import")
    } finally {
      setLinkedInLoading(false)
    }
  }

  // Handle populate from scrape history
  const handlePopulateFromScrape = async (scrapeId: Id<"linkedinScrapes">) => {
    if (!currentScenarioId || !linkedinScrapes) return

    const scrape = linkedinScrapes.find((s) => s._id === scrapeId)
    if (!scrape) return

    await addEmployeesToScenario({
      scenarioId: currentScenarioId,
      employeeIds: scrape.employeeIds,
    })
  }

  // Handle copy from another scenario
  const handleCopyFromScenario = async (sourceScenarioId: Id<"scenarios">) => {
    if (!currentScenarioId) return

    await copyEmployeesFromScenario({
      targetScenarioId: currentScenarioId,
      sourceScenarioId,
    })
  }

  // Handle manually add employee
  const handleManuallyAddEmployee = async () => {
    let targetScenarioId = currentScenarioId

    // If no scenario exists, create one first
    if (!targetScenarioId) {
      try {
        targetScenarioId = await createScenario({ name: "My Scenario" })
        setCurrentScenarioId(targetScenarioId)
      } catch (e) {
        console.error("Failed to create scenario", e)
        return
      }
    }

    if (!targetScenarioId) return

    try {
      // Clear sorting to ensure the new employee (added to top) is visible at top
      setSorting([])
      
      const employeeId = await createEmployee({})
      await addEmployeeToScenario({
        scenarioId: targetScenarioId,
        employeeId,
      })
    } catch (error) {
      console.error("Failed to add employee:", error)
    }
  }

  const handleRemoveFromScenario = async (employeeId: Id<"employees">) => {
    if (!currentScenarioId) return
    await removeEmployeeFromScenario({
      scenarioId: currentScenarioId,
      employeeId,
    })
  }

  const handleClearAll = async () => {
    if (!currentScenarioId) return
    const employeeIds = employees.map(emp => emp._id)
    await removeEmployeesFromScenario({
      scenarioId: currentScenarioId,
      employeeIds,
    })
    setRowSelection({})
  }

  const handleDeleteSelected = async () => {
    if (!currentScenarioId) return
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const employeeIds = selectedRows.map(row => row.original._id)
    await removeEmployeesFromScenario({
      scenarioId: currentScenarioId,
      employeeIds,
    })
    setRowSelection({})
  }

  // Handle inline edit for employee fields
  const handleUpdateEmployee = async (
    employeeId: Id<"employees">,
    field: string,
    value: string
  ) => {
    if (field === "name") {
      const [first, ...rest] = value.split(" ")
      await updateEmployee({
        id: employeeId,
        firstName: first || undefined,
        lastName: rest.join(" ") || undefined,
      })
    } else if (field === "position") {
      await updateEmployee({
        id: employeeId,
        position: value || undefined,
      })
    } else if (field === "salary") {
      const numValue = parseFloat(value)
      await updateEmployee({
        id: employeeId,
        salary: isNaN(numValue) ? undefined : numValue,
      })
    } else if (field === "startDate") {
      // Parse MM/YYYY format
      const parts = value.split("/")
      if (parts.length === 2) {
        const month = parseInt(parts[0])
        const year = parseInt(parts[1])
        await updateEmployee({
          id: employeeId,
          startMonth: isNaN(month) ? undefined : month,
          startYear: isNaN(year) ? undefined : year,
        })
      }
    } else if (field === "endDate") {
      // Parse MM/YYYY format
      const parts = value.split("/")
      if (parts.length === 2) {
        const month = parseInt(parts[0])
        const year = parseInt(parts[1])
        await updateEmployee({
          id: employeeId,
          endMonth: isNaN(month) ? undefined : month,
          endYear: isNaN(year) ? undefined : year,
        })
      } else if (value === "") {
        await updateEmployee({
          id: employeeId,
          endMonth: undefined,
          endYear: undefined,
        })
      }
    }
  }

  // Handler for timeline date updates
  const handleTimelineUpdate = async (
    employeeId: Id<"employees">,
    updates: {
      startMonth?: number
      startYear?: number
      endMonth?: number
      endYear?: number
    }
  ) => {
    await updateEmployee({
      id: employeeId,
      ...updates,
    })
  }

  const columns: ColumnDef<Employee>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      accessorFn: (row) => getDisplayName(row),
      cell: ({ row }) => {
        const name = getDisplayName(row.original)
        return (
          <EditableCell
            value={name === "TBD" ? "" : name}
            onSave={async (val) => {
              await handleUpdateEmployee(row.original._id, "name", val)
            }}
            placeholder="Enter name"
            className="font-medium"
          />
        )
      },
    },
    {
      id: "position",
      header: "Role",
      accessorKey: "position",
      cell: ({ row }) => (
        <EditableCell
          value={row.original.position ?? ""}
          onSave={async (val) => {
            await handleUpdateEmployee(row.original._id, "position", val)
          }}
          placeholder="Enter role"
          className="text-sm"
        />
      ),
    },
    {
      id: "startDate",
      header: "Start Date",
      accessorFn: (row) => {
        if (!row.startMonth || !row.startYear) return ""
        return `${row.startMonth.toString().padStart(2, "0")}/${row.startYear}`
      },
      cell: ({ row }) => {
        const { startMonth, startYear } = row.original
        const dateValue = startMonth && startYear ? `${startMonth}/${startYear}` : ""

        return (
          <EditableCell
            value={dateValue}
            onSave={async (val) => {
              await handleUpdateEmployee(row.original._id, "startDate", val)
            }}
            placeholder="MM/YYYY"
            className="text-sm"
            clearOnEdit
          />
        )
      },
    },
    {
      id: "salary",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="pl-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Salary (MO)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      accessorKey: "salary",
      cell: ({ row }) => (
        <div className="pl-4">
          <EditableCell
            value={row.original.salary ?? ""}
            onSave={async (val) => {
              await handleUpdateEmployee(row.original._id, "salary", val)
            }}
            type="currency"
            placeholder="Enter salary"
            className="text-sm"
          />
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const employee = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex flex-col gap-1.5 p-2" onClick={(e) => e.stopPropagation()}>
                <Label htmlFor={`end-date-${employee._id}`} className="text-xs font-normal text-muted-foreground">
                  End Date (MM/YYYY)
                </Label>
                <Input
                  id={`end-date-${employee._id}`}
                  className="h-8 text-sm"
                  placeholder="Indefinite"
                  defaultValue={
                    employee.endMonth && employee.endYear
                      ? `${employee.endMonth.toString().padStart(2, "0")}/${employee.endYear}`
                      : ""
                  }
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      await handleUpdateEmployee(employee._id, "endDate", e.currentTarget.value)
                      e.currentTarget.blur()
                    }
                  }}
                  onBlur={async (e) => {
                    await handleUpdateEmployee(employee._id, "endDate", e.target.value)
                  }}
                />
              </div>
              {employee.linkedinUrl && (
                <DropdownMenuItem
                  onClick={() => window.open(employee.linkedinUrl, "_blank")}
                >
                  View LinkedIn profile
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleRemoveFromScenario(employee._id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete employee
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: employees,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Show loading state
  if (loading) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="w-full">
      {hasEmployees && (
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Button onClick={handleManuallyAddEmployee}>
              <Plus className="mr-2 h-4 w-4" />
              Add Role/Employee
            </Button>
            {/* View toggle */}
            <div className="flex rounded-md overflow-hidden border">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                className="rounded-none h-8 px-3"
                onClick={() => setViewMode("table")}
              >
                <Table2 className="mr-1.5 h-4 w-4" />
                Table
              </Button>
              <Button
                variant={viewMode === "timeline" ? "default" : "ghost"}
                size="sm"
                className="rounded-none h-8 px-3"
                onClick={() => setViewMode("timeline")}
              >
                <CalendarRange className="mr-1.5 h-4 w-4" />
                Timeline
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {viewMode === "table" && (
              <Input
                placeholder="Filter by name..."
                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm w-[200px]"
              />
            )}
            {viewMode === "table" && table.getFilteredSelectedRowModel().rows.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteSelected}
              >
                Delete Selected ({table.getFilteredSelectedRowModel().rows.length})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Conditional rendering: Table or Timeline */}
      {viewMode === "table" ? (
        <>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-64 align-middle">
                      {isFirstTimeUser ? (
                        // Layout A: First-time user - show LinkedIn input directly
                        <div className="flex flex-col items-center justify-center gap-4 py-4">
                          <div className="text-center space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Import from LinkedIn or add employees manually
                            </p>
                          </div>
                          <div className="w-full max-w-xl">
                            <LinkedinCompanyInput
                              onSubmit={handleLinkedInImportToScenario}
                              loading={linkedInLoading}
                            />
                          </div>
                          {linkedInError && (
                            <p className="text-sm text-destructive">{linkedInError}</p>
                          )}
                          <div className="flex items-center gap-4 w-full max-w-xl">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground">or</span>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                          <Button variant="outline" onClick={handleManuallyAddEmployee}>
                            <Plus className="mr-2 h-4 w-4" />
                            Manually add employee
                          </Button>
                        </div>
                      ) : showLinkedInInput ? (
                        // LinkedIn input expanded state
                        <div className="flex flex-col items-center justify-center gap-4 py-4">
                          <div className="w-full max-w-xl">
                            <LinkedinCompanyInput
                              onSubmit={handleLinkedInImportToScenario}
                              loading={linkedInLoading}
                            />
                          </div>
                          {linkedInError && (
                            <p className="text-sm text-destructive">{linkedInError}</p>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowLinkedInInput(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        // Layout B: Returning user - show all options
                        <div className="flex flex-col items-center justify-center gap-3 py-4">
                          <p className="text-sm font-medium mb-2">No employees in this scenario</p>

                          {/* Copy from scenario dropdown */}
                          {hasOtherScenarios && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-64">
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy from scenario
                                  <ChevronDown className="ml-auto h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-64">
                                <DropdownMenuLabel>Select scenario</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {otherScenarios.map((scenario) => (
                                  <DropdownMenuItem
                                    key={scenario._id}
                                    onClick={() => handleCopyFromScenario(scenario._id)}
                                  >
                                    {scenario.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          {/* Populate from scrape */}
                          {hasScrapeHistory && linkedinScrapes && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-64">
                                  <Link className="mr-2 h-4 w-4" />
                                  Populate from scrape
                                  <ChevronDown className="ml-auto h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-64">
                                <DropdownMenuLabel>Select scrape</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {linkedinScrapes.map((scrape) => (
                                  <DropdownMenuItem
                                    key={scrape._id}
                                    onClick={() => handlePopulateFromScrape(scrape._id)}
                                  >
                                    {scrape.companyName}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          {/* Scrape new LinkedIn URL */}
                          <Button
                            variant="outline"
                            className="w-64"
                            onClick={() => setShowLinkedInInput(true)}
                          >
                            <Link className="mr-2 h-4 w-4" />
                            Scrape new LinkedIn URL
                          </Button>

                          {/* Manually add */}
                          <Button
                            variant="outline"
                            className="w-64"
                            onClick={handleManuallyAddEmployee}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Manually add employee
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {hasEmployees && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="text-muted-foreground flex-1 text-sm">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Timeline view */
        <div className="w-full overflow-hidden">
          <Timeline
            employees={employees}
            onUpdateEmployee={handleTimelineUpdate}
          />
        </div>
      )}
    </div>
  )
}
