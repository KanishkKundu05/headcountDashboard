"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RunwayInputsProps {
  startingCash?: number;
  startingCashMonth?: number;
  startingCashYear?: number;
  onUpdate: (
    startingCash: number | undefined,
    startingCashMonth: number | undefined,
    startingCashYear: number | undefined
  ) => void;
  className?: string;
}

export function RunwayInputs({
  startingCash,
  startingCashMonth,
  startingCashYear,
  onUpdate,
  className,
}: RunwayInputsProps) {
  // Format number with commas
  const formatWithCommas = (value: number): string => {
    return value.toLocaleString("en-US");
  };

  // Remove commas and parse to number
  const parseNumber = (value: string): number | undefined => {
    const cleaned = value.replace(/,/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  };

  const [cashValue, setCashValue] = React.useState(
    startingCash !== undefined ? formatWithCommas(startingCash) : ""
  );
  const [dateValue, setDateValue] = React.useState(() => {
    if (startingCashMonth && startingCashYear) {
      return `${String(startingCashMonth).padStart(2, "0")}/${startingCashYear}`;
    }
    return "";
  });

  const [cashError, setCashError] = React.useState<string | null>(null);
  const [dateError, setDateError] = React.useState<string | null>(null);

  // Update local state when props change
  React.useEffect(() => {
    setCashValue(
      startingCash !== undefined ? formatWithCommas(startingCash) : ""
    );
  }, [startingCash]);

  React.useEffect(() => {
    if (startingCashMonth && startingCashYear) {
      setDateValue(
        `${String(startingCashMonth).padStart(2, "0")}/${startingCashYear}`
      );
    } else {
      setDateValue("");
    }
  }, [startingCashMonth, startingCashYear]);

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow only digits and commas
    const cleaned = value.replace(/[^\d,]/g, "");

    if (!cleaned.trim()) {
      setCashValue("");
      setCashError(null);
      onUpdate(undefined, startingCashMonth, startingCashYear);
      return;
    }

    const numValue = parseNumber(cleaned);
    if (numValue === undefined || numValue < 0) {
      setCashValue(cleaned);
      setCashError("Please enter a valid positive number");
      return;
    }

    // Format with commas
    setCashValue(formatWithCommas(numValue));
    setCashError(null);
    onUpdate(numValue, startingCashMonth, startingCashYear);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateValue(value);

    if (!value.trim()) {
      setDateError(null);
      onUpdate(startingCash, undefined, undefined);
      return;
    }

    // Parse MM/YYYY format
    const parts = value.split("/");
    if (parts.length !== 2) {
      setDateError("Use MM/YYYY format");
      return;
    }

    const month = parseInt(parts[0]);
    const year = parseInt(parts[1]);

    if (isNaN(month) || month < 1 || month > 12) {
      setDateError("Month must be between 1-12");
      return;
    }

    if (isNaN(year) || year < 2000 || year > 2100) {
      setDateError("Please enter a valid year");
      return;
    }

    setDateError(null);
    onUpdate(startingCash, month, year);
  };

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-start", className)}>
      <div className="flex-1 space-y-1">
        <Input
          id="starting-cash"
          type="text"
          placeholder="Starting Cash"
          value={cashValue}
          onChange={handleCashChange}
          className={cn("h-9 text-sm", cashError && "border-destructive")}
        />
        {cashError && <p className="text-xs text-destructive">{cashError}</p>}
      </div>

      <div className="flex-1 space-y-1">
        <Input
          id="starting-date"
          type="text"
          placeholder="MM/YYYY"
          value={dateValue}
          onChange={handleDateChange}
          className={cn("h-9 text-sm", dateError && "border-destructive")}
        />
        {dateError && <p className="text-xs text-destructive">{dateError}</p>}
      </div>
    </div>
  );
}
