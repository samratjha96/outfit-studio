import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("modelImages")
      .withIndex("by_created")
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
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("modelImages", {
      name: args.name,
      storageId: args.storageId,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("modelImages"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return;

    await ctx.storage.delete(item.storageId);
    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return ctx.storage.generateUploadUrl();
  },
});
