import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Employees - belong to a user, can be in multiple scenarios
  // Names are optional to support "possible hires" (placeholders)
  employees: defineTable({
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    pictureUrl: v.optional(v.string()),
    position: v.optional(v.string()),
    salary: v.optional(v.number()),
    startMonth: v.optional(v.number()),
    startYear: v.optional(v.number()),
    linkedinUrl: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Scenarios - contains a vector of employee IDs
  // Same employee can appear in multiple scenarios
  scenarios: defineTable({
    userId: v.id("users"),
    name: v.string(),
    employeeIds: v.array(v.id("employees")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
