import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Generate a random token
function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Create or get existing shared link for the current user
export const createOrGetSharedLink = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user already has a shared link
    const existingLink = await ctx.db
      .query("sharedLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingLink) {
      return existingLink.token;
    }

    // Create new shared link
    const token = generateToken();
    await ctx.db.insert("sharedLinks", {
      userId,
      token,
      createdAt: Date.now(),
    });

    return token;
  },
});

// Get user's shared link (if exists)
export const getMySharedLink = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const link = await ctx.db
      .query("sharedLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return link?.token ?? null;
  },
});

// PUBLIC QUERY - Get shared data by token (no auth required)
export const getSharedData = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // Find the shared link by token
    const link = await ctx.db
      .query("sharedLinks")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!link) return null;

    // Get the owner's user info
    const owner = await ctx.db.get(link.userId);

    // Get all scenarios for the owner
    const scenarios = await ctx.db
      .query("scenarios")
      .withIndex("by_user", (q) => q.eq("userId", link.userId))
      .collect();

    // Get all employees for the owner
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_user", (q) => q.eq("userId", link.userId))
      .collect();

    // Build a map of employees for quick lookup
    const employeeMap = new Map(employees.map((e) => [e._id, e]));

    // Resolve employees for each scenario
    const scenariosWithEmployees = scenarios.map((scenario) => ({
      ...scenario,
      employees: scenario.employeeIds
        .map((id) => employeeMap.get(id))
        .filter((e): e is NonNullable<typeof e> => e !== undefined),
    }));

    return {
      owner: {
        name: owner?.name ?? owner?.email ?? "Anonymous",
        email: owner?.email,
      },
      scenarios: scenariosWithEmployees,
    };
  },
});
