"use client"

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { ShareButton } from "@/components/share-button";
import { Plus, FileText, X } from "lucide-react";
import { useCurrentScenario } from "@/hooks/use-current-scenario";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

export function AppSidebar() {
  const scenarios = useQuery(api.scenarios.getScenarios);
  const currentUser = useQuery(api.users.currentUser);
  const { currentScenarioId, setCurrentScenarioId } = useCurrentScenario();
  const createScenario = useMutation(api.scenarios.createScenario);
  const updateScenario = useMutation(api.scenarios.updateScenario);
  const deleteScenario = useMutation(api.scenarios.deleteScenario);
  const [isCreating, setIsCreating] = React.useState(false);

  const [editingScenarioId, setEditingScenarioId] = React.useState<Id<"scenarios"> | null>(null);
  const [editingName, setEditingName] = React.useState("");

  const loading = scenarios === undefined;

  // Auto-create default scenario if none exist
  React.useEffect(() => {
    if (scenarios !== undefined && scenarios.length === 0) {
      createScenario({
        name: "My Scenario"
      }).then((scenarioId) => {
        setCurrentScenarioId(scenarioId)
      })
    }
  }, [scenarios, createScenario, setCurrentScenarioId])

  const handleCreateScenario = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      // Generate unique name based on existing scenarios
      const baseName = "Untitled Scenario";
      let name = baseName;
      let counter = 1;

      if (scenarios && scenarios.length > 0) {
        const existingNames = new Set(scenarios.map((s) => s.name));
        while (existingNames.has(name)) {
          counter++;
          name = `${baseName} ${counter}`;
        }
      }

      const newScenarioId = await createScenario({ name });
      setCurrentScenarioId(newScenarioId);
    } catch (error) {
      console.error("Failed to create scenario:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteScenario = async (scenarioId: Id<"scenarios">) => {
    try {
      // If deleting the current scenario, switch to another one first
      if (currentScenarioId === scenarioId) {
        const remainingScenarios = scenarios?.filter((s) => s._id !== scenarioId);
        if (remainingScenarios && remainingScenarios.length > 0) {
          setCurrentScenarioId(remainingScenarios[0]._id);
        } else {
          setCurrentScenarioId(null);
        }
      }

      await deleteScenario({ id: scenarioId });
    } catch (error) {
      console.error("Failed to delete scenario:", error);
    }
  };

  const handleStartRenaming = (scenario: typeof scenarios[0]) => {
    if (currentScenarioId === scenario._id) {
      setEditingScenarioId(scenario._id);
      setEditingName(scenario.name);
    }
  };

  const handleRenameSave = async () => {
    if (!editingScenarioId) return;
    if (editingName.trim()) {
      await updateScenario({ id: editingScenarioId, name: editingName.trim() });
    }
    setEditingScenarioId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameSave();
    } else if (e.key === "Escape") {
      setEditingScenarioId(null);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-4 font-semibold border-b text-lg flex justify-between items-center">
          Headcount Planner
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Scenarios</SidebarGroupLabel>
          <SidebarGroupAction
            title="Create new scenario"
            onClick={handleCreateScenario}
            disabled={isCreating}
            className="cursor-pointer"
          >
            <Plus className={isCreating ? "animate-spin" : ""} />
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
                    {editingScenarioId === scenario._id ? (
                      <div className="px-2 py-1 relative">
                        {/* Hidden span for width measurement */}
                        <span className="invisible absolute whitespace-pre px-2 text-sm">{editingName || " "}</span>
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={handleRenameSave}
                          onKeyDown={handleRenameKeyDown}
                          autoFocus
                          className="h-8 border-0 shadow-none focus-visible:ring-0 px-2 py-1 text-sm bg-transparent w-full"
                        />
                      </div>
                    ) : (
                      <SidebarMenuButton
                        isActive={currentScenarioId === scenario._id}
                        onClick={() => setCurrentScenarioId(scenario._id)}
                        onDoubleClick={() => handleStartRenaming(scenario)}
                        title="Double-click to rename"
                      >
                        <FileText className="h-4 w-4" />
                        <span>{scenario.name}</span>
                      </SidebarMenuButton>
                    )}
                    {scenarios.length > 1 && editingScenarioId !== scenario._id && (
                      <SidebarMenuAction
                        showOnHover
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScenario(scenario._id);
                        }}
                        title="Delete scenario"
                        className="hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </SidebarMenuAction>
                    )}
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
