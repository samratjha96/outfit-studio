import { useState, useCallback } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export interface UseOutfitGenerationReturn {
  generatedImage: string | null;
  isGenerating: boolean;
  error: string | null;
  generateOutfit: (
    topItemId: Id<"clothingItems">,
    bottomItemId: Id<"clothingItems">,
    modelImageStorageId?: Id<"_storage">,
  ) => Promise<void>;
  generateNanoOutfit: (
    occasion: string,
    modelImageStorageId?: Id<"_storage">,
  ) => Promise<void>;
  generateOutfitTransfer: (
    inspirationFile: File,
    modelImageStorageId?: Id<"_storage">,
  ) => Promise<void>;
  clearGeneratedImage: () => void;
}

export function useOutfitGeneration(): UseOutfitGenerationReturn {
  const [generationId, setGenerationId] =
    useState<Id<"generations"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Real-time query for the current generation's status
  const generation = useQuery(
    api.generations.get,
    generationId ? { id: generationId } : "skip",
  );

  const startOutfit = useAction(api.generations.startOutfit);
  const startNano = useAction(api.generations.startNano);
  const startTransfer = useAction(api.generations.startTransfer);
  const generateUploadUrl = useMutation(api.clothingItems.generateUploadUrl);

  const isGenerating =
    isStarting ||
    generation?.status === "pending" ||
    generation?.status === "generating";

  const generatedImage =
    generation?.status === "completed" ? (generation.imageUrl ?? null) : null;

  const generationError =
    generation?.status === "failed" ? generation.errorMessage ?? null : null;

  const generateOutfit = useCallback(
    async (
      topItemId: Id<"clothingItems">,
      bottomItemId: Id<"clothingItems">,
      modelImageStorageId?: Id<"_storage">,
    ) => {
      setError(null);
      setIsStarting(true);
      try {
        const id = await startOutfit({ topItemId, bottomItemId, modelImageStorageId });
        setGenerationId(id);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to start generation",
        );
      } finally {
        setIsStarting(false);
      }
    },
    [startOutfit],
  );

  const generateNanoOutfit = useCallback(
    async (occasion: string, modelImageStorageId?: Id<"_storage">) => {
      setError(null);
      setIsStarting(true);
      try {
        const id = await startNano({ occasion, modelImageStorageId });
        setGenerationId(id);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to start generation",
        );
      } finally {
        setIsStarting(false);
      }
    },
    [startNano],
  );

  const generateOutfitTransfer = useCallback(
    async (inspirationFile: File, modelImageStorageId?: Id<"_storage">) => {
      setError(null);
      setIsStarting(true);
      try {
        // Upload the inspiration image to Convex storage first
        const uploadUrl = await generateUploadUrl();
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": inspirationFile.type },
          body: inspirationFile,
        });
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload inspiration image");
        }
        const { storageId } = await uploadResponse.json();

        const id = await startTransfer({
          inspirationStorageId: storageId,
          modelImageStorageId,
        });
        setGenerationId(id);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to start generation",
        );
      } finally {
        setIsStarting(false);
      }
    },
    [startTransfer, generateUploadUrl],
  );

  const clearGeneratedImage = useCallback(() => {
    setGenerationId(null);
    setError(null);
  }, []);

  return {
    generatedImage,
    isGenerating,
    error: error || generationError,
    generateOutfit,
    generateNanoOutfit,
    generateOutfitTransfer,
    clearGeneratedImage,
  };
}
