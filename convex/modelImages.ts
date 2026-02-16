import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const items = await ctx.db
      .query("modelImages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const userModels = await Promise.all(
      items.map(async (item) => ({
        ...item,
        imageUrl: await ctx.storage.getUrl(item.storageId),
        isDefault: false,
      })),
    );

    // Prepend the default model from BODY_IMAGE_STORAGE_ID env var if set
    const defaultStorageId = process.env.BODY_IMAGE_STORAGE_ID;
    if (defaultStorageId) {
      const defaultUrl = await ctx.storage.getUrl(defaultStorageId);
      if (defaultUrl) {
        userModels.unshift({
          _id: "default" as any,
          _creationTime: 0,
          name: "Default",
          storageId: defaultStorageId as any,
          userId: userId as any,
          createdAt: 0,
          imageUrl: defaultUrl,
          isDefault: true,
        });
      }
    }

    return userModels;
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("modelImages", {
      name: args.name,
      storageId: args.storageId,
      userId,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("modelImages"),
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

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return ctx.storage.generateUploadUrl();
  },
});
