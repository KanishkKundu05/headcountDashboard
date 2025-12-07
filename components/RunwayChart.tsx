"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { RunwayDataPoint, formatCurrency } from "@/lib/runway-calculations";

const chartConfig = {
  cash: {
    label: "Cash Balance",
    // Use the base chart color token directly so it resolves to a valid CSS
    // color (oklch in our theme) instead of wrapping it in an invalid hsl().
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface RunwayChartProps {
  data?: RunwayDataPoint[];
  monthsOfRunway?: number;
  totalBurnRate?: number;
  activeEmployeeCount?: number;
  useQuarterlyLabels?: boolean;
  showWarning?: boolean;
  missingInputs?: boolean;
}

export function RunwayChart({
  data,
  monthsOfRunway = 0,
  totalBurnRate = 0,
  activeEmployeeCount = 0,
  useQuarterlyLabels = false,
  showWarning = false,
  missingInputs = false,
}: RunwayChartProps) {
  if (missingInputs) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-6 text-center text-muted-foreground">
          <p>Configure starting cash and date</p>
        </CardContent>
      </Card>
    );
  }

  // For quarterly labels, filter to show only first month of each quarter
  const tickIndices = React.useMemo(() => {
    if (!useQuarterlyLabels || !data) {
      // For monthly view, show ticks at regular intervals
      return undefined; // Let Recharts handle it automatically
    }

    // For quarterly view, show tick at first month of each quarter
    const indices: number[] = [];
    const seenQuarters = new Set<string>();

    data.forEach((point, index) => {
      if (!seenQuarters.has(point.quarter)) {
        indices.push(index);
        seenQuarters.add(point.quarter);
      }
    });

    return indices;
  }, [data, useQuarterlyLabels]);

  // Find the point where cash runs out (first point where cash <= 0)
  const runoutPoint = React.useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const runoutIndex = data.findIndex((point) => point.cash <= 0);
    if (runoutIndex === -1) return null;
    
    // Return the appropriate x-axis value based on label mode
    return useQuarterlyLabels ? data[runoutIndex].quarter : data[runoutIndex].month;
  }, [data, useQuarterlyLabels]);

  const hasData = data && data.length > 0;

  return (
    <Card>
      <CardContent className="pt-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={hasData ? data : []}
            margin={{
              left: 12,
              right: 12,
              top: 4,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey={useQuarterlyLabels ? "quarter" : "month"}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              ticks={
                hasData && useQuarterlyLabels && tickIndices
                  ? tickIndices.map((i) => data[i]?.quarter)
                  : undefined
              }
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                // Format as $500K, $1M, etc.
                if (value >= 1000000) {
                  return `$${(value / 1000000).toFixed(1)}M`;
                }
                if (value >= 1000) {
                  return `$${(value / 1000).toFixed(0)}K`;
                }
                return `$${value}`;
              }}
            />
            {hasData && (
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value, payload) => {
                      // Always show month-level detail in tooltip
                      if (payload && payload.length > 0) {
                        const dataPoint = payload[0].payload as RunwayDataPoint;
                        return dataPoint.month;
                      }
                      return value;
                    }}
                    formatter={(value, name) => {
                      if (name === "cash") {
                        return [formatCurrency(value as number), "Cash Balance"];
                      }
                      return [value, name];
                    }}
                  />
                }
              />
            )}
            <Line
              dataKey="cash"
              type="monotone"
              // Use the CSS variable injected by `ChartContainer` for the
              // `cash` series, which now resolves to a valid oklch color.
              stroke="var(--color-cash)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {/* Red dotted vertical line at runway end */}
            {runoutPoint && (
              <ReferenceLine
                x={runoutPoint}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: "Runway End",
                  position: "top",
                  fill: "#ef4444",
                  fontSize: 12,
                }}
              />
            )}
          </LineChart>
        </ChartContainer>

        {/* Metrics - inline below chart */}
        {hasData && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Runway:</span>
              <span className="font-medium">{monthsOfRunway} months</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Monthly Burn:</span>
              <span className="font-medium">{formatCurrency(totalBurnRate)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Active Employees:</span>
              <span className="font-medium">{activeEmployeeCount}</span>
            </div>
          </div>
        )}

        {/* Warning message if no employees with valid data */}
        {showWarning && (
          <div className="mt-4 rounded-md border border-yellow-500/50 bg-yellow-50 p-3 dark:bg-yellow-950/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              No employees have both salary and start date filled in. Add this
              data to see burn rate calculations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
