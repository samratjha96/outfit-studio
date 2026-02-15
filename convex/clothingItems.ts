import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";

export const list = query({
  args: {
    category: v.union(v.literal("tops"), v.literal("bottoms")),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("clothingItems")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .order("desc")
      .collect();

    return Promise.all(
      items.map(async (item) => ({
        ...item,
        imageUrl: await ctx.storage.getUrl(item.storageId),
      })),
    );
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    category: v.union(v.literal("tops"), v.literal("bottoms")),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("clothingItems", {
      name: args.name,
      category: args.category,
      storageId: args.storageId,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("clothingItems"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return;

    // Delete the stored image file
    await ctx.storage.delete(item.storageId);
    // Delete the database record
    await ctx.db.delete(args.id);
  },
});

// Internal: get a clothing item by ID (used by generation worker)
export const getInternal = internalQuery({
  args: { id: v.id("clothingItems") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return ctx.storage.generateUploadUrl();
  },
});
