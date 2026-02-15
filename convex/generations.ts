import { v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  buildOutfitCombinePrompt,
  buildNanoPrompt,
  buildTransferPrompt,
} from "./imageProvider";

// Internal: create a generation record
export const create = internalMutation({
  args: {
    type: v.union(
      v.literal("outfit"),
      v.literal("nano"),
      v.literal("transfer"),
    ),
    prompt: v.string(),
    topItemId: v.optional(v.id("clothingItems")),
    bottomItemId: v.optional(v.id("clothingItems")),
    inspirationImageId: v.optional(v.id("_storage")),
    modelImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("generations", {
      type: args.type,
      status: "pending",
      prompt: args.prompt,
      topItemId: args.topItemId,
      bottomItemId: args.bottomItemId,
      inspirationImageId: args.inspirationImageId,
      modelImageId: args.modelImageId,
      createdAt: Date.now(),
    });
  },
});

// Internal: update generation status (called by worker)
export const updateStatus = internalMutation({
  args: {
    id: v.id("generations"),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    storageId: v.optional(v.id("_storage")),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Internal: get generation for worker
export const getInternal = internalQuery({
  args: { id: v.id("generations") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

// Public: get a single generation with image URL
export const get = query({
  args: { id: v.id("generations") },
  handler: async (ctx, args) => {
    const generation = await ctx.db.get(args.id);
    if (!generation) return null;

    return {
      ...generation,
      imageUrl: generation.storageId
        ? await ctx.storage.getUrl(generation.storageId)
        : null,
    };
  },
});

// Public: get the most recent generation (for preview panel)
export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    const generation = await ctx.db
      .query("generations")
      .withIndex("by_created")
      .order("desc")
      .first();

    if (!generation) return null;

    return {
      ...generation,
      imageUrl: generation.storageId
        ? await ctx.storage.getUrl(generation.storageId)
        : null,
    };
  },
});

// Action: start an outfit combination generation
export const startOutfit = action({
  args: {
    topItemId: v.id("clothingItems"),
    bottomItemId: v.id("clothingItems"),
    modelImageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args): Promise<Id<"generations">> => {
    const prompt = buildOutfitCombinePrompt();

    const generationId: Id<"generations"> = await ctx.runMutation(
      internal.generations.create,
      {
        type: "outfit",
        prompt,
        topItemId: args.topItemId,
        bottomItemId: args.bottomItemId,
        modelImageId: args.modelImageStorageId,
      },
    );

    await ctx.scheduler.runAfter(0, internal.generationWorker.run, {
      generationId,
    });

    return generationId;
  },
});

// Action: start a nano (occasion-based) generation
export const startNano = action({
  args: {
    occasion: v.string(),
    modelImageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args): Promise<Id<"generations">> => {
    const prompt = buildNanoPrompt(args.occasion);

    const generationId: Id<"generations"> = await ctx.runMutation(
      internal.generations.create,
      {
        type: "nano",
        prompt,
        modelImageId: args.modelImageStorageId,
      },
    );

    await ctx.scheduler.runAfter(0, internal.generationWorker.run, {
      generationId,
    });

    return generationId;
  },
});

// Action: start an outfit transfer generation
export const startTransfer = action({
  args: {
    inspirationStorageId: v.id("_storage"),
    modelImageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args): Promise<Id<"generations">> => {
    const prompt = buildTransferPrompt();

    const generationId: Id<"generations"> = await ctx.runMutation(
      internal.generations.create,
      {
        type: "transfer",
        prompt,
        inspirationImageId: args.inspirationStorageId,
        modelImageId: args.modelImageStorageId,
      },
    );

    await ctx.scheduler.runAfter(0, internal.generationWorker.run, {
      generationId,
    });

    return generationId;
  },
});
