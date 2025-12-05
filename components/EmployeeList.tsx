"use client"

import * as React from "react"
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
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

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
import type { FilteredEmployee } from "@/lib/types/apify"
import { useEmployees } from "@/hooks/use-employees"

export const columns: ColumnDef<FilteredEmployee>[] = [
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
    accessorFn: (row) => `${row.firstName} ${row.lastName}`.trim(),
    cell: ({ row }) => {
      const original = row.original
      const fullName = `${original.firstName} ${original.lastName}`.trim()
      return (
        <div className="font-medium">
          {fullName || "Unknown"}
        </div>
      )
    },
  },
  {
    accessorKey: "currentTitle",
    header: "Role",
    cell: ({ row }) => {
      const title = row.original.currentTitle
      return <div className="text-sm text-muted-foreground">{title ?? "—"}</div>
    },
  },
  {
    id: "startDate",
    header: () => <div className="text-right pr-4">Start Date</div>,
    accessorFn: (row) => {
      if (!row.currentStartMonth || !row.currentStartYear) return ""
      return `${row.currentStartMonth.toString().padStart(2, "0")}/${row.currentStartYear}`
    },
    cell: ({ row }) => {
      const { currentStartMonth, currentStartYear } = row.original

      if (!currentStartYear) {
        return <div className="text-right text-sm text-muted-foreground">—</div>
      }

      const month =
        typeof currentStartMonth === "number" && currentStartMonth >= 1 && currentStartMonth <= 12
          ? new Date(2000, currentStartMonth - 1, 1).toLocaleString("en-US", {
              month: "short",
            })
          : ""

      return (
        <div className="text-right text-sm pr-4">
          {month ? `${month} ${currentStartYear}` : currentStartYear}
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
    accessorFn: () => "",
    cell: () => <div className="text-sm text-muted-foreground">—</div>,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(
                  `${payment.firstName ?? ""} ${payment.lastName ?? ""}`.trim()
                )
              }
            >
              Copy name
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View LinkedIn profile</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function DataTableDemo() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const { employees, loading, error, fetchByCompanyUrl } = useEmployees()

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

  const hasEmployees = employees.length > 0

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
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
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
                <TableCell
                  colSpan={columns.length}
                  className="h-64 align-middle"
                >
                  {hasEmployees ? (
                    <div className="text-center text-sm text-muted-foreground">
                      No results.
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 py-4">
                      <p className="text-sm text-muted-foreground">
                        Populate the table from your company's LinkedIn profile.
                      </p>
                      <div className="w-full max-w-xl">
                        <LinkedinCompanyInput
                          onSubmit={fetchByCompanyUrl}
                          loading={loading}
                        />
                      </div>
                      {error && (
                        <p className="text-sm text-destructive">
                          {error}
                        </p>
                      )}
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
    </div>
  )
}
