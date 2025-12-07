import { Suspense } from "react";
import { DataTableDemo } from "@/components/EmployeeList";
import { CashRunwayVisualization } from "@/components/CashRunwayVisualization";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col gap-5 px-8 pb-8 pt-4 font-sans dark:bg-black overflow-x-hidden w-full max-w-full">
      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <CashRunwayVisualization />
      </Suspense>
      <Suspense
        fallback={
          <div className="w-full space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <DataTableDemo />
      </Suspense>
    </div>
  );
}
