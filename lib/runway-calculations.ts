import { Id } from "@/convex/_generated/dataModel";

// Employee with necessary fields for calculations
export interface RunwayEmployee {
  _id: Id<"employees">;
  salary?: number;
  startMonth?: number;
  startYear?: number;
}

// Data point for chart
export interface RunwayDataPoint {
  month: string; // "Jan 2025" (for tooltip)
  monthYear: string; // "2025-01" (for sorting)
  quarter: string; // "Q1 2025" (for quarterly X-axis)
  cash: number; // Cash balance at start of month
  burn: number; // Monthly burn for this month
}

// Result of runway calculation
export interface RunwayCalculation {
  dataPoints: RunwayDataPoint[];
  monthsOfRunway: number;
  totalBurnRate: number;
  activeEmployeeCount: number;
  useQuarterlyLabels: boolean; // True if >= 24 months
}

/**
 * Compare two dates (month/year format)
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
function compareDates(
  month1: number,
  year1: number,
  month2: number,
  year2: number
): number {
  if (year1 !== year2) return year1 - year2;
  return month1 - month2;
}

/**
 * Format month/year as readable string
 */
function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * Format month/year as YYYY-MM for sorting
 */
function formatMonthYearISO(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Get quarter number (1-4) from month (1-12)
 */
function getQuarter(month: number): number {
  return Math.ceil(month / 3);
}

/**
 * Format quarter and year as "Q1 2025"
 */
function formatQuarter(month: number, year: number): string {
  const quarter = getQuarter(month);
  return `Q${quarter} ${year}`;
}

/**
 * Calculate monthly burn rate for a given month/year
 */
function calculateMonthlyBurn(
  employees: RunwayEmployee[],
  month: number,
  year: number
): { burn: number; activeCount: number } {
  let burn = 0;
  let activeCount = 0;

  for (const employee of employees) {
    // Skip employees without salary or start date
    if (!employee.salary || !employee.startMonth || !employee.startYear) {
      continue;
    }

    // Check if employee is active in this month
    const isActive =
      compareDates(employee.startMonth, employee.startYear, month, year) <= 0;

    if (isActive) {
      burn += employee.salary;
      activeCount++;
    }
  }

  return { burn, activeCount };
}

/**
 * Generate next month/year
 */
function getNextMonth(
  month: number,
  year: number
): { month: number; year: number } {
  if (month === 12) {
    return { month: 1, year: year + 1 };
  }
  return { month: month + 1, year };
}

/**
 * Main calculation function for cash runway
 */
export function calculateRunway(
  startingCash: number,
  startingCashMonth: number,
  startingCashYear: number,
  employees: RunwayEmployee[]
): RunwayCalculation {
  const dataPoints: RunwayDataPoint[] = [];

  let currentCash = startingCash;
  let currentMonth = startingCashMonth;
  let currentYear = startingCashYear;

  // Safety limit: max 120 months (10 years)
  const maxMonths = 120;
  let monthCount = 0;

  // Add initial data point (starting cash)
  const { burn: initialBurn, activeCount: initialCount } = calculateMonthlyBurn(
    employees,
    currentMonth,
    currentYear
  );

  dataPoints.push({
    month: formatMonthYear(currentMonth, currentYear),
    monthYear: formatMonthYearISO(currentMonth, currentYear),
    quarter: formatQuarter(currentMonth, currentYear),
    cash: currentCash,
    burn: initialBurn,
  });

  // Generate monthly projections until cash runs out or max months reached
  while (currentCash > 0 && monthCount < maxMonths) {
    // Move to next month
    const next = getNextMonth(currentMonth, currentYear);
    currentMonth = next.month;
    currentYear = next.year;
    monthCount++;

    // Calculate burn for this month
    const { burn, activeCount } = calculateMonthlyBurn(
      employees,
      currentMonth,
      currentYear
    );

    // Deduct burn from cash
    currentCash = Math.max(0, currentCash - burn);

    dataPoints.push({
      month: formatMonthYear(currentMonth, currentYear),
      monthYear: formatMonthYearISO(currentMonth, currentYear),
      quarter: formatQuarter(currentMonth, currentYear),
      cash: currentCash,
      burn,
    });

    // If cash hits zero, stop
    if (currentCash === 0) break;
  }

  // Calculate summary stats from final month's burn rate
  const finalDataPoint = dataPoints[dataPoints.length - 1];
  const currentBurnRate = finalDataPoint.burn;
  const { activeCount } = calculateMonthlyBurn(
    employees,
    currentMonth,
    currentYear
  );

  return {
    dataPoints,
    monthsOfRunway: dataPoints.length - 1, // Subtract 1 to exclude initial month
    totalBurnRate: currentBurnRate,
    activeEmployeeCount: activeCount,
    useQuarterlyLabels: dataPoints.length >= 24,
  };
}

/**
 * Validate inputs for runway calculation
 */
export function validateRunwayInputs(
  startingCash?: number,
  startingCashMonth?: number,
  startingCashYear?: number
): { valid: boolean; message?: string } {
  if (startingCash === undefined) {
    return { valid: false, message: "Starting cash is required" };
  }
  if (startingCash < 0) {
    return { valid: false, message: "Starting cash must be positive" };
  }
  if (!startingCashMonth || startingCashMonth < 1 || startingCashMonth > 12) {
    return { valid: false, message: "Valid starting month is required (1-12)" };
  }
  if (!startingCashYear || startingCashYear < 2000 || startingCashYear > 2100) {
    return {
      valid: false,
      message: "Valid starting year is required",
    };
  }
  return { valid: true };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
