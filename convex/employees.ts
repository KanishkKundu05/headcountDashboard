import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get all employees for the current user
export const getEmployees = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("employees")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Get specific employees by their IDs
export const getEmployeesByIds = query({
  args: { ids: v.array(v.id("employees")) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const employees = await Promise.all(
      args.ids.map((id) => ctx.db.get(id))
    );

    // Filter out nulls and ensure they belong to the user
    return employees.filter(
      (emp): emp is NonNullable<typeof emp> =>
        emp !== null && emp.userId === userId
    );
  },
});

// Create a new employee
export const createEmployee = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    pictureUrl: v.optional(v.string()),
    position: v.optional(v.string()),
    salary: v.optional(v.number()),
    startMonth: v.optional(v.number()),
    startYear: v.optional(v.number()),
    linkedinUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("employees", {
      userId,
      ...args,
    });
  },
});

// Update an existing employee
export const updateEmployee = mutation({
  args: {
    id: v.id("employees"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    pictureUrl: v.optional(v.string()),
    position: v.optional(v.string()),
    salary: v.optional(v.number()),
    startMonth: v.optional(v.number()),
    startYear: v.optional(v.number()),
    linkedinUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const employee = await ctx.db.get(args.id);
    if (!employee || employee.userId !== userId) {
      throw new Error("Employee not found");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Delete an employee (also removes from all scenarios)
export const deleteEmployee = mutation({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const employee = await ctx.db.get(args.id);
    if (!employee || employee.userId !== userId) {
      throw new Error("Employee not found");
    }

    // Remove from all scenarios
    const scenarios = await ctx.db
      .query("scenarios")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const scenario of scenarios) {
      if (scenario.employeeIds.includes(args.id)) {
        await ctx.db.patch(scenario._id, {
          employeeIds: scenario.employeeIds.filter((id) => id !== args.id),
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Bulk create employees (for LinkedIn imports)
export const bulkCreateEmployees = mutation({
  args: {
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

    const ids = await Promise.all(
      args.employees.map((emp) =>
        ctx.db.insert("employees", {
          userId,
          ...emp,
        })
      )
    );

    return ids;
  },
});
