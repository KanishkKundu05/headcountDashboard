import { DataTableDemo } from "@/components/EmployeeList";
import { CashRunwayVisualization } from "@/components/CashRunwayVisualization";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col gap-8 p-8 font-sans dark:bg-black">
      <CashRunwayVisualization />
      <DataTableDemo />
    </div>
  );
}
