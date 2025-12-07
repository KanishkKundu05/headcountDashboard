import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get all scenarios for the current user
export const getScenarios = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("scenarios")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Get a single scenario with its employees resolved
export const getScenarioWithEmployees = query({
  args: { id: v.id("scenarios") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const scenario = await ctx.db.get(args.id);
    if (!scenario || scenario.userId !== userId) {
      return null;
    }

    const employees = await Promise.all(
      scenario.employeeIds.map((id) => ctx.db.get(id))
    );

    return {
      ...scenario,
      employees: employees.filter(
        (emp): emp is NonNullable<typeof emp> => emp !== null
      ),
    };
  },
});

// Create a new scenario
export const createScenario = mutation({
  args: {
    name: v.string(),
    employeeIds: v.optional(v.array(v.id("employees"))),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    return await ctx.db.insert("scenarios", {
      userId,
      name: args.name,
      employeeIds: args.employeeIds ?? [],
      isDefault: args.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a scenario (rename)
export const updateScenario = mutation({
  args: {
    id: v.id("scenarios"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const scenario = await ctx.db.get(args.id);
    if (!scenario || scenario.userId !== userId) {
      throw new Error("Scenario not found");
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

// Delete a scenario (employees remain)
export const deleteScenario = mutation({
  args: { id: v.id("scenarios") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const scenario = await ctx.db.get(args.id);
    if (!scenario || scenario.userId !== userId) {
      throw new Error("Scenario not found");
    }

    // Prevent deletion if this is the last scenario
    const userScenarios = await ctx.db
      .query("scenarios")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (userScenarios.length <= 1) {
      throw new Error("Cannot delete the last scenario");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Add an employee to a scenario
export const addEmployeeToScenario = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario || scenario.userId !== userId) {
      throw new Error("Scenario not found");
    }

    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.userId !== userId) {
      throw new Error("Employee not found");
    }

    if (!scenario.employeeIds.includes(args.employeeId)) {
      await ctx.db.patch(args.scenarioId, {
        employeeIds: [...scenario.employeeIds, args.employeeId],
        updatedAt: Date.now(),
      });
    }

    return args.scenarioId;
  },
});

// Remove an employee from a scenario
export const removeEmployeeFromScenario = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario || scenario.userId !== userId) {
      throw new Error("Scenario not found");
    }

    await ctx.db.patch(args.scenarioId, {
      employeeIds: scenario.employeeIds.filter((id) => id !== args.employeeId),
      updatedAt: Date.now(),
    });

    return args.scenarioId;
  },
});

// Remove multiple employees from a scenario at once
export const removeEmployeesFromScenario = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    employeeIds: v.array(v.id("employees")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario || scenario.userId !== userId) {
      throw new Error("Scenario not found");
    }

    // Create a Set for O(1) lookup
    const idsToRemove = new Set(args.employeeIds);

    await ctx.db.patch(args.scenarioId, {
      employeeIds: scenario.employeeIds.filter((id) => !idsToRemove.has(id)),
      updatedAt: Date.now(),
    });

    return args.scenarioId;
  },
});

// Create a scenario from LinkedIn import (bulk create employees + scenario + scrape record)
export const createScenarioFromLinkedIn = mutation({
  args: {
    name: v.string(),
    companyUrl: v.optional(v.string()),
    employees: v.array(
      v.object({
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        pictureUrl: v.optional(v.string()),
        position: v.optional(v.string()),
        salary: v.optional(v.number()),
        startMonth: v.optional(v.number()),
        startYear: v.optional(v.number()),
        linkedinUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Create all employees
    const employeeIds = await Promise.all(
      args.employees.map((emp) =>
        ctx.db.insert("employees", {
          userId,
          ...emp,
        })
      )
    );

    // Create the scenario with the employee IDs
    const now = Date.now();
    const scenarioId = await ctx.db.insert("scenarios", {
      userId,
      name: args.name,
      employeeIds,
      createdAt: now,
      updatedAt: now,
    });

    // Create scrape history record if companyUrl provided
    if (args.companyUrl) {
      await ctx.db.insert("linkedinScrapes", {
        userId,
        companyName: args.name,
        companyUrl: args.companyUrl,
        employeeIds,
        createdAt: now,
      });
    }

    return { scenarioId, employeeIds };
  },
});

// Get LinkedIn scrape history for the current user
export const getLinkedinScrapes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("linkedinScrapes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Add multiple employees to a scenario (for populate from scrape or copy)
export const addEmployeesToScenario = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    employeeIds: v.array(v.id("employees")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario || scenario.userId !== userId) {
      throw new Error("Scenario not found");
    }

    // Filter out employees already in the scenario
    const existingIds = new Set(scenario.employeeIds);
    const newIds = args.employeeIds.filter((id) => !existingIds.has(id));

    if (newIds.length > 0) {
      await ctx.db.patch(args.scenarioId, {
        employeeIds: [...scenario.employeeIds, ...newIds],
        updatedAt: Date.now(),
      });
    }

    return args.scenarioId;
  },
});

// Add employees from LinkedIn import to an existing scenario
export const addEmployeesFromLinkedIn = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    companyName: v.string(),
    companyUrl: v.string(),
    employees: v.array(
      v.object({
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        pictureUrl: v.optional(v.string()),
        position: v.optional(v.string()),
        salary: v.optional(v.number()),
        startMonth: v.optional(v.number()),
        startYear: v.optional(v.number()),
        linkedinUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario || scenario.userId !== userId) {
      throw new Error("Scenario not found");
    }

    // Create all employees
    const employeeIds = await Promise.all(
      args.employees.map((emp) =>
        ctx.db.insert("employees", {
          userId,
          ...emp,
        })
      )
    );

    // Add employees to scenario
    const now = Date.now();
    await ctx.db.patch(args.scenarioId, {
      employeeIds: [...scenario.employeeIds, ...employeeIds],
      updatedAt: now,
    });

    // Create scrape history record
    await ctx.db.insert("linkedinScrapes", {
      userId,
      companyName: args.companyName,
      companyUrl: args.companyUrl,
      employeeIds,
      createdAt: now,
    });

    return { scenarioId: args.scenarioId, employeeIds };
  },
});

// Copy employees from one scenario to another
export const copyEmployeesFromScenario = mutation({
  args: {
    targetScenarioId: v.id("scenarios"),
    sourceScenarioId: v.id("scenarios"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const targetScenario = await ctx.db.get(args.targetScenarioId);
    if (!targetScenario || targetScenario.userId !== userId) {
      throw new Error("Target scenario not found");
    }

    const sourceScenario = await ctx.db.get(args.sourceScenarioId);
    if (!sourceScenario || sourceScenario.userId !== userId) {
      throw new Error("Source scenario not found");
    }

    // Filter out employees already in target scenario
    const existingIds = new Set(targetScenario.employeeIds);
    const newIds = sourceScenario.employeeIds.filter((id) => !existingIds.has(id));

    if (newIds.length > 0) {
      await ctx.db.patch(args.targetScenarioId, {
        employeeIds: [...targetScenario.employeeIds, ...newIds],
        updatedAt: Date.now(),
      });
    }

    return args.targetScenarioId;
  },
});

// Update scenario financial settings (starting cash and date)
export const updateScenarioFinancials = mutation({
  args: {
    id: v.id("scenarios"),
    startingCash: v.optional(v.number()),
    startingCashMonth: v.optional(v.number()),
    startingCashYear: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const scenario = await ctx.db.get(args.id);
    if (!scenario || scenario.userId !== userId) {
      throw new Error("Scenario not found");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});
