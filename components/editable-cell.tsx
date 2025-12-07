"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface EditableCellProps {
  value: string | number | undefined
  onSave: (value: string) => Promise<void>
  type?: "text" | "number" | "currency"
  placeholder?: string
  className?: string
  clearOnEdit?: boolean
}

export function EditableCell({
  value,
  onSave,
  type = "text",
  placeholder = "—",
  className,
  clearOnEdit = false,
}: EditableCellProps) {
  const [editing, setEditing] = React.useState(false)
  const [tempValue, setTempValue] = React.useState(String(value ?? ""))
  const [isSaving, setIsSaving] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [inputWidth, setInputWidth] = React.useState<number | undefined>(undefined)
  const spanRef = React.useRef<HTMLSpanElement>(null)

  // Update temp value when prop changes (e.g., after save)
  React.useEffect(() => {
    if (!editing) {
      setTempValue(String(value ?? ""))
    }
  }, [value, editing])

  // Measure text width
  React.useEffect(() => {
    if (editing && spanRef.current) {
      const width = spanRef.current.offsetWidth
      // Add a tiny buffer for cursor and ensure min width for empty state
      setInputWidth(Math.max(width + 4, 10)) 
    }
  }, [tempValue, editing, placeholder])

  // Focus input when editing starts
  React.useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if (!clearOnEdit) {
        inputRef.current.select()
      }
    }
  }, [editing, clearOnEdit])

  const handleClick = () => {
    if (!isSaving) {
      setEditing(true)
      if (clearOnEdit) {
        setTempValue("")
      }
    }
  }

  const handleSave = async () => {
    if (isSaving) return

    const newValue = tempValue.trim()
    const originalValue = String(value ?? "")

    // Only save if value changed
    if (newValue !== originalValue) {
      setIsSaving(true)
      try {
        await onSave(newValue)
      } catch (error) {
        console.error("Failed to save:", error)
        setTempValue(originalValue)
      } finally {
        setIsSaving(false)
      }
    }
    setEditing(false)
  }

  const handleCancel = () => {
    setTempValue(String(value ?? ""))
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleBlur = () => {
    handleSave()
  }

  // Format display value
  const displayValue = React.useMemo(() => {
    if (value === undefined || value === null || value === "") {
      return placeholder
    }

    if (type === "currency" && typeof value === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value)
    }

    return String(value)
  }, [value, type, placeholder])

  const isEmpty = value === undefined || value === null || value === ""

  if (editing) {
    return (
      <div className={cn("relative inline-flex items-center -mx-2 -my-1", className)}>
        {/* Hidden span for measuring width */}
        <span
          ref={spanRef}
          className={cn(
            "invisible absolute whitespace-pre px-2",
            className
          )}
          style={{ height: 0, overflow: "hidden" }}
          aria-hidden="true"
        >
          {tempValue || placeholder}
        </span>
        <Input
          ref={inputRef}
          type={type === "currency" || type === "number" ? "number" : "text"}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isSaving}
          placeholder={placeholder}
          style={{ width: inputWidth ? `${inputWidth}px` : "auto" }}
          className={cn(
            "h-8 px-2 py-1 border-0 rounded-none shadow-none focus-visible:ring-0 bg-transparent hide-spinners p-0 m-0",
            className
          )}
        />
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "cursor-pointer rounded px-2 py-1 -mx-2 -my-1 hover:bg-muted/50 transition-colors min-h-[32px] flex items-center border border-transparent hover:border-border",
        isEmpty && "text-muted-foreground italic",
        className
      )}
    >
      {displayValue}
    </div>
  )
}
