import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { getProvider } from "./imageProvider";

// Helper: fetch images from Convex storage as ArrayBuffer + mimeType
async function fetchImages(
  ctx: { storage: { get: (id: string) => Promise<Blob | null> } },
  ids: string[],
): Promise<Array<{ data: ArrayBuffer; mimeType: string }>> {
  const blobs = await Promise.all(ids.map((id) => ctx.storage.get(id)));
  return Promise.all(
    blobs
      .filter((blob): blob is Blob => blob !== null)
      .map(async (blob) => ({
        data: await blob.arrayBuffer(),
        mimeType: blob.type || "image/jpeg",
      })),
  );
}


export const run = internalAction({
  args: {
    generationId: v.id("generations"),
  },
  handler: async (ctx, args) => {
    const generation = await ctx.runQuery(internal.generations.getInternal, {
      id: args.generationId,
    });

    if (!generation) {
      throw new Error(`Generation ${args.generationId} not found`);
    }

    const provider = getProvider();

    await ctx.runMutation(internal.generations.updateStatus, {
      id: args.generationId,
      status: "generating",
      provider: provider.id,
    });

    try {
      const referenceImages: Array<{ data: ArrayBuffer; mimeType: string }> =
        [];

      // Use the model image from the generation record, or fall back to env var
      const bodyImageStorageId =
        generation.modelImageId ?? process.env.BODY_IMAGE_STORAGE_ID;
      if (!bodyImageStorageId) {
        throw new Error(
          "No model image selected and BODY_IMAGE_STORAGE_ID env var not set. Upload a model image or set the env var.",
        );
      }

      if (generation.type === "outfit") {
        // Outfit combine mode: top image + bottom image + body image
        const imageIds: string[] = [];
        if (generation.topItemId) {
          const topItem = await ctx.runQuery(
            internal.clothingItems.getInternal,
            { id: generation.topItemId },
          );
          if (topItem) imageIds.push(topItem.storageId);
        }
        if (generation.bottomItemId) {
          const bottomItem = await ctx.runQuery(
            internal.clothingItems.getInternal,
            { id: generation.bottomItemId },
          );
          if (bottomItem) imageIds.push(bottomItem.storageId);
        }

        const clothingImages = await fetchImages(ctx, imageIds);
        referenceImages.push(...clothingImages);

        // Add body model image from Convex storage
        const bodyImages = await fetchImages(ctx, [bodyImageStorageId]);
        referenceImages.push(...bodyImages);
      } else if (generation.type === "nano") {
        // Nano mode: just the body model image
        const bodyImages = await fetchImages(ctx, [bodyImageStorageId]);
        referenceImages.push(...bodyImages);
      } else if (generation.type === "transfer") {
        // Transfer mode: body image + inspiration image
        const bodyImages = await fetchImages(ctx, [bodyImageStorageId]);
        referenceImages.push(...bodyImages);

        if (generation.inspirationImageId) {
          const inspirationImages = await fetchImages(ctx, [
            generation.inspirationImageId,
          ]);
          referenceImages.push(...inspirationImages);
        }
      }

      const result = await provider.generate({
        prompt: generation.prompt,
        referenceImages,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      const storageId = await ctx.storage.store(result.imageBlob);

      await ctx.runMutation(internal.generations.updateStatus, {
        id: args.generationId,
        status: "completed",
        storageId,
        model: result.model,
        completedAt: Date.now(),
      });
    } catch (error) {
      await ctx.runMutation(internal.generations.updateStatus, {
        id: args.generationId,
        status: "failed",
        errorMessage:
          error instanceof Error ? error.message : "Unknown error",
        completedAt: Date.now(),
      });
    }
  },
});
