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
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    return await ctx.db.insert("scenarios", {
      userId,
      name: args.name,
      employeeIds: args.employeeIds ?? [],
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

// Create a scenario from LinkedIn import (bulk create employees + scenario)
export const createScenarioFromLinkedIn = mutation({
  args: {
    name: v.string(),
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

    return { scenarioId, employeeIds };
  },
});
