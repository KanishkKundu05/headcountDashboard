import { DataTableDemo } from "@/components/EmployeeList";
import { CashRunwayVisualization } from "@/components/CashRunwayVisualization";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col gap-5 px-8 pb-8 pt-4 font-sans dark:bg-black overflow-x-hidden w-full max-w-full">
      <CashRunwayVisualization />
      <DataTableDemo />
    </div>
  );
}
