"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { ShareButton } from "@/components/share-button";
import { Plus, FileText } from "lucide-react";
import { useCurrentScenario } from "@/hooks/use-current-scenario";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  const scenarios = useQuery(api.scenarios.getScenarios);
  const currentUser = useQuery(api.users.currentUser);
  const { currentScenarioId, setCurrentScenarioId } = useCurrentScenario();

  const loading = scenarios === undefined;

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-4 font-semibold border-b text-lg">Headcount</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Scenarios</SidebarGroupLabel>
          <SidebarGroupAction title="Create new scenario">
            <Plus />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                <>
                  <SidebarMenuItem>
                    <Skeleton className="h-8 w-full" />
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Skeleton className="h-8 w-full" />
                  </SidebarMenuItem>
                </>
              ) : scenarios && scenarios.length > 0 ? (
                scenarios.map((scenario) => (
                  <SidebarMenuItem key={scenario._id}>
                    <SidebarMenuButton
                      isActive={currentScenarioId === scenario._id}
                      onClick={() => setCurrentScenarioId(scenario._id)}
                    >
                      <FileText className="h-4 w-4" />
                      <span>{scenario.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <SidebarMenuItem>
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No scenarios yet
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-2">
        <div className="px-2">
          <ShareButton />
        </div>
        <Separator />
        {currentUser ? (
          <NavUser
            user={{
              name: currentUser.name ?? currentUser.email ?? "User",
              email: currentUser.email ?? "",
              avatar: currentUser.image ?? "",
            }}
          />
        ) : (
          <Skeleton className="h-12 w-full" />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
