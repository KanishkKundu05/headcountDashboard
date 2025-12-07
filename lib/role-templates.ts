// Hardcoded role templates for drag-and-drop onto timeline
export interface RoleTemplate {
    id: string;
    name: string;
    defaultSalary: number;
    color: string;
  }
  
  export const ROLE_TEMPLATES: RoleTemplate[] = [
    { id: "jr-swe", name: "Jr. SWE", defaultSalary: 14000, color: "#3B82F6" },
    { id: "sr-swe", name: "Sr. SWE", defaultSalary: 16000, color: "#3B82F6" },
    { id: "pm", name: "PM", defaultSalary: 14000, color: "#3B82F6" },
    { id: "ux-designer", name: "UX Designer", defaultSalary: 11000, color: "#EC4899" },
    { id: "account-exec", name: "Account Executive", defaultSalary: 8000, color: "#3B82F6" },
    { id: "growth-eng", name: "Growth Eng.", defaultSalary: 12000, color: "#3B82F6" },
  ];
  
  // Helper to format currency
  export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  
  