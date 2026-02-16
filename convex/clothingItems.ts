import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    category: v.union(v.literal("tops"), v.literal("bottoms")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const items = await ctx.db
      .query("clothingItems")
      .withIndex("by_user", (q) =>
        q.eq("userId", userId).eq("category", args.category),
      )
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("clothingItems", {
      name: args.name,
      category: args.category,
      storageId: args.storageId,
      userId,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("clothingItems"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.id);
    if (!item) return;
    if (item.userId !== userId) throw new Error("Not authorized");

    await ctx.storage.delete(item.storageId);
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return ctx.storage.generateUploadUrl();
  },
});
