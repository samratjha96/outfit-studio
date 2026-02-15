import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  clothingItems: defineTable({
    name: v.string(),
    category: v.union(v.literal("tops"), v.literal("bottoms")),
    storageId: v.id("_storage"),
    createdAt: v.number(),
  }).index("by_category", ["category", "createdAt"]),

  modelImages: defineTable({
    name: v.string(),
    storageId: v.id("_storage"),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),

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
    // For outfit mode: references to top/bottom clothing items
    topItemId: v.optional(v.id("clothingItems")),
    bottomItemId: v.optional(v.id("clothingItems")),
    // For transfer mode: uploaded inspiration image
    inspirationImageId: v.optional(v.id("_storage")),
    // Custom model/body image (falls back to BODY_IMAGE_STORAGE_ID env var)
    modelImageId: v.optional(v.id("_storage")),
    // Output
    storageId: v.optional(v.id("_storage")),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),
});
