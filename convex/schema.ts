import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  defaultClothing: defineTable({
    name: v.string(),
    category: v.union(v.literal("tops"), v.literal("bottoms")),
    storageId: v.id("_storage"),
  }),

  clothingItems: defineTable({
    name: v.string(),
    category: v.union(v.literal("tops"), v.literal("bottoms")),
    storageId: v.id("_storage"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_category", ["category", "createdAt"])
    .index("by_user", ["userId", "category", "createdAt"]),

  modelImages: defineTable({
    name: v.string(),
    storageId: v.id("_storage"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_created", ["createdAt"])
    .index("by_user", ["userId", "createdAt"]),

  inspoImages: defineTable({
    name: v.string(),
    storageId: v.id("_storage"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"]),

  generations: defineTable({
    type: v.union(
      v.literal("outfit"),
      v.literal("nano"),
      v.literal("transfer"),
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    prompt: v.string(),
    topItemId: v.optional(v.id("clothingItems")),
    bottomItemId: v.optional(v.id("clothingItems")),
    inspirationImageId: v.optional(v.id("_storage")),
    modelImageId: v.optional(v.id("_storage")),
    storageId: v.optional(v.id("_storage")),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    userId: v.id("users"),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_user", ["userId", "createdAt"]),

  usageLimits: defineTable({
    userId: v.id("users"),
    date: v.string(),
    count: v.number(),
  }).index("by_user_date", ["userId", "date"]),
});
