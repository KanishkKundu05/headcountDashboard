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
import { ArrowUpDown, MoreHorizontal, Trash2, UserMinus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Skeleton } from "@/components/ui/skeleton"

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
  const createScenarioFromLinkedIn = useMutation(api.scenarios.createScenarioFromLinkedIn)
  const deleteEmployee = useMutation(api.employees.deleteEmployee)
  const removeEmployeeFromScenario = useMutation(api.scenarios.removeEmployeeFromScenario)

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [linkedInLoading, setLinkedInLoading] = React.useState(false)
  const [linkedInError, setLinkedInError] = React.useState<string | null>(null)

  // Auto-select first scenario if none selected
  React.useEffect(() => {
    if (!currentScenarioId && scenarios && scenarios.length > 0) {
      setCurrentScenarioId(scenarios[0]._id)
    }
  }, [currentScenarioId, scenarios, setCurrentScenarioId])

  const employees: Employee[] = scenarioWithEmployees?.employees ?? []
  const loading = scenarios === undefined || (currentScenarioId && scenarioWithEmployees === undefined)
  const hasScenarios = scenarios && scenarios.length > 0
  const hasEmployees = employees.length > 0

  // Handle LinkedIn import - creates a new scenario
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

      // Create scenario with employees
      const result = await createScenarioFromLinkedIn({
        name: scenarioName,
        employees: fetchedEmployees.map((emp: { firstName?: string; lastName?: string; pictureUrl?: string; currentTitle?: string; currentStartMonth?: number; currentStartYear?: number }) => ({
          firstName: emp.firstName,
          lastName: emp.lastName,
          pictureUrl: emp.pictureUrl,
          position: emp.currentTitle,
          startMonth: emp.currentStartMonth,
          startYear: emp.currentStartYear,
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

  const handleDeleteEmployee = async (employeeId: Id<"employees">) => {
    await deleteEmployee({ id: employeeId })
  }

  const handleRemoveFromScenario = async (employeeId: Id<"employees">) => {
    if (!currentScenarioId) return
    await removeEmployeeFromScenario({
      scenarioId: currentScenarioId,
      employeeId,
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
        const isPlaceholder = !row.original.firstName && !row.original.lastName
        return (
          <div className={`font-medium ${isPlaceholder ? "text-muted-foreground italic" : ""}`}>
            {name}
          </div>
        )
      },
    },
    {
      id: "position",
      header: "Role",
      accessorKey: "position",
      cell: ({ row }) => {
        const position = row.original.position
        return <div className="text-sm text-muted-foreground">{position ?? "—"}</div>
      },
    },
    {
      id: "startDate",
      header: () => <div className="text-right pr-4">Start Date</div>,
      accessorFn: (row) => {
        if (!row.startMonth || !row.startYear) return ""
        return `${row.startMonth.toString().padStart(2, "0")}/${row.startYear}`
      },
      cell: ({ row }) => {
        const { startMonth, startYear } = row.original

        if (!startYear) {
          return <div className="text-right text-sm text-muted-foreground pr-4">—</div>
        }

        const month =
          typeof startMonth === "number" && startMonth >= 1 && startMonth <= 12
            ? new Date(2000, startMonth - 1, 1).toLocaleString("en-US", {
                month: "short",
              })
            : ""

        return (
          <div className="text-right text-sm pr-4">
            {month ? `${month} ${startYear}` : startYear}
          </div>
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
          Salary
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      accessorKey: "salary",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground pl-4">
          {formatSalary(row.original.salary)}
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
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(getDisplayName(employee))
                }
              >
                Copy name
              </DropdownMenuItem>
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
                className="text-orange-600"
              >
                <UserMinus className="mr-2 h-4 w-4" />
                Remove from scenario
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteEmployee(employee._id)}
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

  // Show empty state when no scenarios exist
  if (!hasScenarios) {
    return (
      <div className="w-full">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Start Date</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="h-64 align-middle">
                  <div className="flex flex-col items-center justify-center gap-4 py-4">
                    <p className="text-sm text-muted-foreground">
                      Create your first scenario by importing from LinkedIn.
                    </p>
                    <div className="w-full max-w-xl">
                      <LinkedinCompanyInput
                        onSubmit={handleLinkedInSubmit}
                        loading={linkedInLoading}
                      />
                    </div>
                    {linkedInError && (
                      <p className="text-sm text-destructive">{linkedInError}</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {hasEmployees && (
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter by name..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
      )}

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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No employees in this scenario.
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
    </div>
  )
}
