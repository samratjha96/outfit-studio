import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listDefaults = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("defaultClothing").collect();
  },
});

export const addDefault = mutation({
  args: {
    name: v.string(),
    category: v.union(v.literal("tops"), v.literal("bottoms")),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("defaultClothing", {
      name: args.name,
      category: args.category,
      storageId: args.storageId,
    });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return ctx.storage.generateUploadUrl();
  },
});

export const seedUser = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user already has clothing items
    const existing = await ctx.db
      .query("clothingItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) return { seeded: false };

    // Copy all defaults into user's clothing items
    const defaults = await ctx.db.query("defaultClothing").collect();
    for (const item of defaults) {
      await ctx.db.insert("clothingItems", {
        name: item.name,
        category: item.category,
        storageId: item.storageId,
        userId,
        createdAt: Date.now(),
      });
    }

    return { seeded: true, count: defaults.length };
  },
});
